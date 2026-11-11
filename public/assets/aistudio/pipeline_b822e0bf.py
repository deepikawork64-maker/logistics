"""
Email -> Ticket pipeline.
Run once:      python pipeline.py
Run in loop:   python pipeline.py --loop     (polls every 30 sec)
"""
import imaplib, smtplib, email, os, re, sys, time, json
from email.header import decode_header, make_header
from email.message import EmailMessage
from email.utils import parseaddr, make_msgid
from dotenv import load_dotenv

import db

load_dotenv()
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASS = os.getenv("GMAIL_APP_PASSWORD")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
EVENT_NAME = os.getenv("EVENT_NAME", "the Event")

CATEGORIES = list(db.TEAM_MAP.keys())
REQ_TAG = re.compile(r"\[REQ-(\d{5})\]")
SKIP_SENDERS = ("no-reply", "noreply", "mailer-daemon", "postmaster", "donotreply")


# ---------------------------------------------------------------- helpers
def get_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                return part.get_payload(decode=True).decode(errors="ignore")
        return ""
    payload = msg.get_payload(decode=True)
    return payload.decode(errors="ignore") if payload else ""


def is_auto_mail(msg, sender):
    s = sender.lower()
    if GMAIL_USER and s == GMAIL_USER.lower():
        return True
    if any(k in s for k in SKIP_SENDERS):
        return True
    if msg.get("Auto-Submitted", "no").lower() != "no":
        return True
    if msg.get("Precedence", "").lower() in ("bulk", "junk", "list"):
        return True
    return False


def send_mail(to, subject, body, in_reply_to=None, auto=True):
    m = EmailMessage()
    m["From"] = GMAIL_USER
    m["To"] = to
    m["Subject"] = subject
    m["Message-ID"] = make_msgid()
    if auto:
        m["Auto-Submitted"] = "auto-replied"  # prevents reply loops
    if in_reply_to:
        m["In-Reply-To"] = in_reply_to
        m["References"] = in_reply_to
    m.set_content(body)
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(GMAIL_USER, GMAIL_PASS)
        s.send_message(m)
    return m["Message-ID"]


# ---------------------------------------------------------------- AI step
PROMPT = """You are an event-support assistant. Classify the attendee email below.

Categories: registration, travel, accommodation, transportation, venue, food, vip_protocol, general
Priority: High (VIP, urgent, same-day/next-day travel, medical/accessibility), Medium, Low

Return ONLY valid JSON with keys:
  "category": one of the categories,
  "summary": 1-2 sentence summary of what the attendee needs,
  "priority": "High" | "Medium" | "Low",
  "confidence": number between 0 and 1

Subject: {subject}
Body:
{body}
"""

KEYWORDS = {
    "registration": ["register", "registration", "badge", "pass", "invite"],
    "travel": ["flight", "train", "ticket", "travel", "arrival", "departure"],
    "accommodation": ["hotel", "room", "stay", "check-in", "accommodation"],
    "transportation": ["cab", "pickup", "drop", "shuttle", "transport", "airport"],
    "venue": ["venue", "hall", "seating", "parking", "location", "entry"],
    "food": ["food", "meal", "lunch", "dinner", "veg", "diet", "allergy"],
    "vip_protocol": ["vip", "minister", "protocol", "secretary", "ceo", "chairman"],
}


def fallback_classify(subject, body):
    text = f"{subject} {body}".lower()
    best, score = "general", 0
    for cat, words in KEYWORDS.items():
        sc = sum(w in text for w in words)
        if sc > score:
            best, score = cat, sc
    return {
        "category": best,
        "summary": (body.strip().replace("\n", " ")[:160] or subject),
        "priority": "High" if best == "vip_protocol" else "Medium",
        "confidence": 0.5 if score else 0.3,
    }


def classify(subject, body):
    if not GEMINI_KEY:
        return fallback_classify(subject, body)
    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_KEY)
        resp = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=PROMPT.format(subject=subject, body=body[:3000]),
            config={"response_mime_type": "application/json"},
        )
        data = json.loads(resp.text)
        if data.get("category") not in CATEGORIES:
            data["category"] = "general"
        data["confidence"] = float(data.get("confidence", 0.5))
        return data
    except Exception as e:
        print("  [AI failed, using keyword fallback]", e)
        return fallback_classify(subject, body)


# ---------------------------------------------------------------- core
def process_email(c, msg):
    subject = str(make_header(decode_header(msg["Subject"] or "(no subject)")))
    name, sender = parseaddr(msg["From"])
    body = get_body(msg)
    msg_id = msg["Message-ID"] or make_msgid()

    if is_auto_mail(msg, sender):
        print("  skipped auto/own mail from", sender)
        return

    if c.execute("SELECT 1 FROM messages WHERE msg_id=?", (msg_id,)).fetchone():
        return  # already processed

    c.execute("INSERT OR IGNORE INTO attendees(email,name) VALUES(?,?)", (sender, name))

    # ---- reply to an existing ticket?
    tag = REQ_TAG.search(subject)
    if tag and c.execute(
        "SELECT status FROM requests WHERE request_id=?", (f"REQ-{tag.group(1)}",)
    ).fetchone():
        rid = f"REQ-{tag.group(1)}"
        old = c.execute("SELECT status FROM requests WHERE request_id=?", (rid,)).fetchone()["status"]
        c.execute(
            "INSERT INTO messages(request_id,msg_id,direction,sender,body) VALUES(?,?,?,?,?)",
            (rid, msg_id, "in", sender, body),
        )
        if old in ("Responded", "Resolved", "Closed"):
            c.execute("UPDATE requests SET status='In Progress' WHERE request_id=?", (rid,))
            db.log_status(c, rid, old, "In Progress", "attendee reply")
        c.commit()
        print(f"  follow-up added to {rid}")
        return

    # ---- new ticket
    ai = classify(subject, body)
    team = db.TEAM_MAP.get(ai["category"], "General Support")
    status = "Assigned"
    if ai["confidence"] < 0.6:
        team, status = "Manual Review", "New"

    cur = c.execute(
        """INSERT INTO requests(attendee_email,subject,category,summary,priority,
                                confidence,status,team,assigned_at)
           VALUES(?,?,?,?,?,?,?,?,CASE WHEN ?='Assigned' THEN CURRENT_TIMESTAMP END)""",
        (sender, subject, ai["category"], ai["summary"], ai["priority"],
         ai["confidence"], status, team, status),
    )
    rid = f"REQ-{cur.lastrowid:05d}"
    c.execute("UPDATE requests SET request_id=? WHERE id=?", (rid, cur.lastrowid))
    c.execute(
        "INSERT INTO messages(request_id,msg_id,direction,sender,body) VALUES(?,?,?,?,?)",
        (rid, msg_id, "in", sender, body),
    )
    db.log_status(c, rid, None, "New", "system")
    if status == "Assigned":
        db.log_status(c, rid, "New", "Assigned", "auto-assign")
    c.commit()
    print(f"  created {rid} | {ai['category']} | {ai['priority']} | conf={ai['confidence']:.2f} -> {team}")

    # ---- acknowledgement
    ack = (
        f"Dear {name or 'Attendee'},\n\n"
        f"Thank you for contacting the {EVENT_NAME} support team. "
        f"We have received your request.\n\n"
        f"Your Request ID: {rid}\n\n"
        f"Please quote this ID (keep [{rid}] in the subject) in any further communication. "
        f"Our team will get back to you shortly.\n\n"
        f"Regards,\n{EVENT_NAME} Support Team"
    )
    out_id = send_mail(sender, f"[{rid}] Re: {subject}", ack, in_reply_to=msg_id)
    c.execute(
        "INSERT OR IGNORE INTO messages(request_id,msg_id,direction,sender,body) VALUES(?,?,?,?,?)",
        (rid, out_id, "out", GMAIL_USER, ack),
    )
    c.commit()


def run_once():
    c = db.conn()
    M = imaplib.IMAP4_SSL("imap.gmail.com")
    M.login(GMAIL_USER, GMAIL_PASS)
    M.select("INBOX")
    _, ids = M.search(None, "UNSEEN")
    nums = ids[0].split()
    print(f"{len(nums)} unseen email(s)")
    for num in nums:
        _, data = M.fetch(num, "(RFC822)")
        process_email(c, email.message_from_bytes(data[0][1]))
    M.logout()
    c.close()


if __name__ == "__main__":
    db.init()
    if "--loop" in sys.argv:
        while True:
            try:
                run_once()
            except Exception as e:
                print("error:", e)
            time.sleep(30)
    else:
        run_once()
