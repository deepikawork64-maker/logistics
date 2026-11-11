"""Business logic used by the Streamlit app and the background worker."""
import re
import db


def audit(c, user, action, rid=None, details=""):
    c.execute(
        "INSERT INTO audit_log(user,action,request_id,details) VALUES(?,?,?,?)",
        (user, action, rid, details),
    )


def set_status(c, rid, new, user, reason=""):
    row = c.execute("SELECT status FROM requests WHERE request_id=?", (rid,)).fetchone()
    if not row or row["status"] == new:
        return
    old = row["status"]

    sets, params = ["status=?"], [new]
    if new == "Resolved":
        sets.append("resolved_at=datetime('now')")
    elif new == "Closed":
        sets += ["closed_at=datetime('now')", "resolved_at=COALESCE(resolved_at, datetime('now'))"]
    elif new == "Escalated":
        sets += ["escalated_at=datetime('now')", "escalation_reason=?"]
        params.append(reason)
    elif new == "Responded":
        sets.append("responded_at=COALESCE(responded_at, datetime('now'))")
    elif new in ("New", "Assigned", "In Progress") and old in ("Resolved", "Closed"):
        sets += ["resolved_at=NULL", "closed_at=NULL"]  # re-opened

    params.append(rid)
    c.execute(f"UPDATE requests SET {', '.join(sets)} WHERE request_id=?", params)
    db.log_status(c, rid, old, new, user)
    audit(c, user, "status_change", rid, f"{old} -> {new} {reason}".strip())
    c.commit()


def assign(c, rid, team, owner, user):
    c.execute(
        "UPDATE requests SET team=?, owner=?, assigned_at=datetime('now') WHERE request_id=?",
        (team, owner or None, rid),
    )
    audit(c, user, "assign", rid, f"team={team}, owner={owner or '-'}")
    c.commit()
    status = c.execute("SELECT status FROM requests WHERE request_id=?", (rid,)).fetchone()["status"]
    if status == "New" and team != "Manual Review":
        set_status(c, rid, "Assigned", user)


def escalate(c, rid, reason, user):
    set_status(c, rid, "Escalated", user, reason or "manual escalation")


def add_note(c, rid, text, user):
    c.execute(
        "INSERT INTO messages(request_id,direction,sender,body) VALUES(?,?,?,?)",
        (rid, "note", user, text),
    )
    audit(c, user, "internal_note", rid, "")
    c.commit()


def send_reply(c, rid, body, user):
    """Send an email reply to the attendee from the event mailbox and log it."""
    from pipeline import send_mail, EVENT_NAME, GMAIL_USER

    r = c.execute("SELECT * FROM requests WHERE request_id=?", (rid,)).fetchone()
    if not r:
        raise ValueError("Ticket not found")
    last_in = c.execute(
        "SELECT msg_id FROM messages WHERE request_id=? AND direction='in' ORDER BY id DESC LIMIT 1",
        (rid,),
    ).fetchone()

    clean_subject = re.sub(r"^(re:\s*)+", "", r["subject"] or "", flags=re.I)
    clean_subject = re.sub(r"^\[REQ-\d{5}\]\s*", "", clean_subject)
    subject = f"[{rid}] Re: {clean_subject}"
    full_body = f"{body}\n\nRegards,\n{EVENT_NAME} Support Team\n(Request ID: {rid})"

    out_id = send_mail(
        r["attendee_email"], subject, full_body,
        in_reply_to=last_in["msg_id"] if last_in else None, auto=False,
    )
    c.execute(
        "INSERT INTO messages(request_id,msg_id,direction,sender,body) VALUES(?,?,?,?,?)",
        (rid, out_id, "out", GMAIL_USER, full_body),
    )
    c.execute(
        "UPDATE requests SET responded_at=COALESCE(responded_at, datetime('now')) WHERE request_id=?",
        (rid,),
    )
    audit(c, user, "reply_sent", rid, f"to={r['attendee_email']}")
    c.commit()
    if r["status"] in db.OPEN_STATUSES:
        set_status(c, rid, "Responded", user)
