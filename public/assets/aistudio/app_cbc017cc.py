import streamlit as st
import pandas as pd

import db, services, sla

st.set_page_config(page_title="Event Request Management", page_icon="📬", layout="wide")
db.init()

STATUS_ICON = {
    "New": "🆕", "Assigned": "📌", "In Progress": "🔧", "Responded": "💬",
    "Resolved": "✅", "Escalated": "🚨", "Closed": "🔒",
}


# ------------------------------------------------------------------ auth
def login_view():
    st.title("📬 Event Request Management")
    st.caption("Sign in to continue")
    with st.form("login"):
        u = st.text_input("Username")
        p = st.text_input("Password", type="password")
        ok = st.form_submit_button("Login")
    if ok:
        row = db.verify_user(u.strip(), p)
        if row:
            st.session_state.user = dict(row)
            c = db.conn()
            services.audit(c, row["username"], "login")
            c.commit()
            c.close()
            st.rerun()
        else:
            st.error("Invalid username or password")


if "user" not in st.session_state:
    login_view()
    st.stop()

user = st.session_state.user
role = user["role"]
me = user["username"]
CAN_ASSIGN = role in ("admin", "lead")
CAN_WORK = role in ("admin", "lead", "agent")


def flash(msg):
    st.session_state["flash"] = msg


def show_flash():
    if "flash" in st.session_state:
        st.success(st.session_state.pop("flash"))


def scoped_df():
    df = sla.load_requests()
    if role == "agent" and user.get("team"):
        df = df[(df["team"] == user["team"]) | (df["owner"] == me)]
    return df


# ------------------------------------------------------------------ sidebar
pages = ["Dashboard", "Tickets", "Attendees"]
if role in ("admin", "lead"):
    pages.append("Audit Log")
if role == "admin":
    pages.append("Admin")

with st.sidebar:
    st.markdown(f"### 👤 {user['name']}")
    st.caption(f"Role: **{role}**" + (f" · Team: {user['team']}" if user.get("team") else ""))
    page = st.radio("Navigate", pages, label_visibility="collapsed")
    st.divider()
    with st.expander("Change my password"):
        np1 = st.text_input("New password", type="password", key="np1")
        if st.button("Update password"):
            if len(np1) < 6:
                st.error("Minimum 6 characters")
            else:
                db.set_password(me, np1)
                st.success("Password updated")
    if st.button("Logout"):
        c = db.conn()
        services.audit(c, me, "logout")
        c.commit()
        c.close()
        st.session_state.clear()
        st.rerun()


# ------------------------------------------------------------------ dashboard
def page_dashboard():
    st.title("📊 Dashboard")
    df = scoped_df()
    if df.empty:
        st.info("No requests yet. Send a test email to the event mailbox and run the worker.")
        return

    k = st.columns(6)
    k[0].metric("Total requests", len(df))
    k[1].metric("Open", int(df["is_open"].sum()))
    k[2].metric("Unassigned", int(df["is_unassigned"].sum()))
    k[3].metric("Overdue", int(df["is_overdue"].sum()))
    k[4].metric("Escalated", int((df["status"] == "Escalated").sum()))
    frh = df["first_response_hrs"].mean()
    k[5].metric("Avg first response (hrs)", "-" if pd.isna(frh) else f"{frh:.1f}")

    c1, c2 = st.columns(2)
    with c1:
        st.subheader("Requests by category")
        st.bar_chart(df["category"].value_counts())
    with c2:
        st.subheader("Requests by status")
        st.bar_chart(df["status"].value_counts())

    c3, c4 = st.columns(2)
    with c3:
        st.subheader("Daily request volume")
        st.line_chart(df.groupby(df["created_at"].dt.date).size())
    with c4:
        st.subheader("Open workload by team")
        o = df[df["is_open"]]
        if o.empty:
            st.caption("No open requests")
        else:
            st.bar_chart(pd.crosstab(o["team"].fillna("Unassigned"), o["status"]))

    st.subheader("🔴 Needs attention (overdue / unassigned / escalated)")
    att = df[df["is_overdue"] | df["is_unassigned"] | (df["status"] == "Escalated")]
    if att.empty:
        st.success("Nothing pending attention 🎉")
    else:
        st.dataframe(
            att[["request_id", "created_at", "attendee_email", "category", "priority",
                 "status", "team", "owner", "age_hours", "summary"]]
            .sort_values("created_at"),
            hide_index=True,
        )


# ------------------------------------------------------------------ tickets
def page_tickets():
    st.title("🎫 Tickets")
    show_flash()
    df = scoped_df()
    if df.empty:
        st.info("No tickets yet.")
        return

    f1, f2, f3, f4 = st.columns(4)
    status_f = f1.multiselect("Status", db.STATUSES)
    cat_f = f2.multiselect("Category", sorted(df["category"].dropna().unique()))
    team_f = f3.multiselect("Team", sorted(df["team"].dropna().unique()))
    prio_f = f4.multiselect("Priority", ["High", "Medium", "Low"])
    g1, g2, g3 = st.columns([3, 1, 1])
    q = g1.text_input("Search (ID, email, subject, summary)")
    only_overdue = g2.checkbox("Overdue only")
    only_unassigned = g3.checkbox("Unassigned only")

    v = df.copy()
    if status_f:
        v = v[v["status"].isin(status_f)]
    if cat_f:
        v = v[v["category"].isin(cat_f)]
    if team_f:
        v = v[v["team"].isin(team_f)]
    if prio_f:
        v = v[v["priority"].isin(prio_f)]
    if only_overdue:
        v = v[v["is_overdue"]]
    if only_unassigned:
        v = v[v["is_unassigned"]]
    if q:
        ql = q.lower()
        mask = pd.Series(False, index=v.index)
        for col in ("request_id", "attendee_email", "subject", "summary"):
            mask |= v[col].fillna("").str.lower().str.contains(ql, regex=False)
        v = v[mask]

    v = v.sort_values(["is_overdue", "created_at"], ascending=[False, False])
    v = v.assign(flag=v["is_overdue"].map({True: "🔴 Overdue", False: ""}))
    st.caption(f"{len(v)} ticket(s)")
    st.dataframe(
        v[["request_id", "flag", "created_at", "attendee_email", "category", "priority",
           "status", "team", "owner", "age_hours", "summary"]],
        hide_index=True,
    )

    rid = st.selectbox("Open ticket", [""] + v["request_id"].tolist(), key="sel_rid")
    if rid:
        ticket_detail(rid)


def ticket_detail(rid):
    c = db.conn()
    r = c.execute("SELECT * FROM requests WHERE request_id=?", (rid,)).fetchone()
    msgs = c.execute("SELECT * FROM messages WHERE request_id=? ORDER BY id", (rid,)).fetchall()
    hist = c.execute("SELECT * FROM status_history WHERE request_id=? ORDER BY id", (rid,)).fetchall()
    attendee = c.execute("SELECT * FROM attendees WHERE email=?", (r["attendee_email"],)).fetchone()

    st.divider()
    st.subheader(f"{STATUS_ICON.get(r['status'], '')} {rid} — {r['subject']}")
    m = st.columns(5)
    m[0].markdown(f"**Status**  \n{r['status']}")
    m[1].markdown(f"**Category**  \n{r['category']}")
    m[2].markdown(f"**Priority**  \n{r['priority']}")
    m[3].markdown(f"**Team**  \n{r['team'] or '-'}")
    m[4].markdown(f"**Owner**  \n{r['owner'] or '-'}")
    name = attendee["name"] if attendee and attendee["name"] else ""
    st.markdown(f"**Attendee:** {name} <{r['attendee_email']}>")
    st.info(f"**AI summary:** {r['summary']}  (confidence {r['confidence'] or 0:.2f})")
    if r["escalation_reason"] and r["status"] == "Escalated":
        st.warning(f"Escalated: {r['escalation_reason']}")

    tab_conv, tab_act, tab_hist = st.tabs(["💬 Conversation", "⚙️ Actions", "🕒 History"])

    with tab_conv:
        for msg in msgs:
            if msg["direction"] == "in":
                who, avatar = "user", None
                label = f"{msg['sender']} · {msg['created_at']} UTC"
            elif msg["direction"] == "out":
                who, avatar = "assistant", None
                label = f"Event team · {msg['created_at']} UTC"
            else:
                who, avatar = "assistant", "📝"
                label = f"Internal note by {msg['sender']} · {msg['created_at']} UTC"
            with st.chat_message(who, avatar=avatar):
                st.caption(label)
                st.text(msg["body"] or "")

    with tab_act:
        if not CAN_WORK:
            st.info("Your role has read-only access.")
        else:
            act_error = None
            try:
                # ---- reply
                st.markdown("#### Reply to attendee")
                reply = st.text_area("Message", key=f"reply_{rid}", height=140)
                if st.button("Send reply", key=f"send_{rid}"):
                    if not reply.strip():
                        st.warning("Write a message first")
                    else:
                        services.send_reply(c, rid, reply.strip(), me)
                        flash(f"Reply sent for {rid}")
                        st.rerun()

                # ---- internal note
                st.markdown("#### Internal note")
                note = st.text_input("Note (not sent to attendee)", key=f"note_{rid}")
                if st.button("Add note", key=f"addnote_{rid}") and note.strip():
                    services.add_note(c, rid, note.strip(), me)
                    flash("Note added")
                    st.rerun()

                st.markdown("#### Assignment")
                if CAN_ASSIGN:
                    a1, a2 = st.columns(2)
                    cur_team = r["team"] if r["team"] in db.TEAMS else db.TEAMS[0]
                    team = a1.selectbox("Team", db.TEAMS, index=db.TEAMS.index(cur_team), key=f"team_{rid}")
                    users = [u["username"] for u in db.list_users() if u["active"] and u["team"] == team]
                    owner = a2.selectbox("Owner", ["(none)"] + users, key=f"owner_{rid}")
                    if st.button("Save assignment", key=f"assign_{rid}"):
                        services.assign(c, rid, team, None if owner == "(none)" else owner, me)
                        flash("Assignment updated")
                        st.rerun()
                if st.button("Assign to me", key=f"me_{rid}"):
                    services.assign(c, rid, r["team"] or user.get("team") or "General Support", me, me)
                    flash("Assigned to you")
                    st.rerun()

                st.markdown("#### Status")
                s1, s2 = st.columns([2, 1])
                options = [s for s in db.STATUSES if s != "Escalated"]
                idx = options.index(r["status"]) if r["status"] in options else 0
                new_status = s1.selectbox("Set status", options, index=idx, key=f"status_{rid}")
                if s2.button("Update status", key=f"upd_{rid}"):
                    services.set_status(c, rid, new_status, me)
                    flash(f"Status set to {new_status}")
                    st.rerun()

                st.markdown("#### Escalate")
                reason = st.text_input("Reason", key=f"esc_{rid}")
                if st.button("🚨 Escalate", key=f"escbtn_{rid}"):
                    services.escalate(c, rid, reason, me)
                    flash(f"{rid} escalated")
                    st.rerun()
            except Exception as e:  # e.g. SMTP errors
                act_error = e
            if act_error:
                st.error(f"Action failed: {act_error}")

    with tab_hist:
        if hist:
            st.dataframe(
                pd.DataFrame([dict(h) for h in hist])[["changed_at", "old_status", "new_status", "changed_by"]],
                hide_index=True,
            )
        else:
            st.caption("No status history")
    c.close()


# ------------------------------------------------------------------ attendees
def page_attendees():
    st.title("👥 Attendees")
    df = scoped_df()
    if df.empty:
        st.info("No attendees yet.")
        return
    agg = (
        df.groupby("attendee_email")
        .agg(total_requests=("request_id", "count"), open_requests=("is_open", "sum"),
             last_request=("created_at", "max"))
        .reset_index()
        .sort_values("last_request", ascending=False)
    )
    st.dataframe(agg, hide_index=True)
    pick = st.selectbox("View attendee history", [""] + agg["attendee_email"].tolist())
    if pick:
        st.dataframe(
            df[df["attendee_email"] == pick][
                ["request_id", "created_at", "category", "priority", "status", "team", "summary"]
            ].sort_values("created_at", ascending=False),
            hide_index=True,
        )


# ------------------------------------------------------------------ audit
def page_audit():
    st.title("🧾 Audit Log")
    c = db.conn()
    a = pd.read_sql_query("SELECT * FROM audit_log ORDER BY id DESC LIMIT 1000", c)
    c.close()
    if a.empty:
        st.info("No audit entries yet.")
        return
    f1, f2 = st.columns(2)
    u = f1.multiselect("User", sorted(a["user"].dropna().unique()))
    ac = f2.multiselect("Action", sorted(a["action"].dropna().unique()))
    if u:
        a = a[a["user"].isin(u)]
    if ac:
        a = a[a["action"].isin(ac)]
    st.dataframe(a, hide_index=True)


# ------------------------------------------------------------------ admin
def page_admin():
    st.title("🛠 Admin")
    show_flash()
    t_users, t_ops, t_cfg = st.tabs(["Users", "Operations", "Configuration"])

    with t_users:
        users = db.list_users()
        st.dataframe(pd.DataFrame([dict(u) for u in users]), hide_index=True)

        st.markdown("#### Create user")
        with st.form("create_user"):
            c1, c2, c3 = st.columns(3)
            un = c1.text_input("Username")
            nm = c2.text_input("Full name")
            pw = c3.text_input("Password", type="password")
            c4, c5 = st.columns(2)
            rl = c4.selectbox("Role", db.ROLES, index=2)
            tm = c5.selectbox("Team", ["(none)"] + db.TEAMS)
            if st.form_submit_button("Create"):
                if not un.strip() or len(pw) < 6:
                    st.error("Username required and password min 6 chars")
                else:
                    try:
                        db.create_user(un.strip(), nm.strip() or un.strip(), pw, rl, None if tm == "(none)" else tm)
                        c = db.conn()
                        services.audit(c, me, "user_created", None, f"{un} ({rl})")
                        c.commit()
                        c.close()
                        flash(f"User {un} created")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Could not create user: {e}")

        st.markdown("#### Reset password / activate / deactivate")
        names = [u["username"] for u in users]
        sel = st.selectbox("User", names)
        r1, r2, r3 = st.columns(3)
        newp = r1.text_input("New password", type="password", key="resetpw")
        if r1.button("Reset password") and len(newp) >= 6:
            db.set_password(sel, newp)
            flash(f"Password reset for {sel}")
            st.rerun()
        if r2.button("Deactivate") and sel != me:
            db.set_active(sel, False)
            flash(f"{sel} deactivated")
            st.rerun()
        if r3.button("Activate"):
            db.set_active(sel, True)
            flash(f"{sel} activated")
            st.rerun()

    with t_ops:
        st.markdown("Normally `python worker.py` does this automatically every minute.")
        o1, o2, o3 = st.columns(3)
        if o1.button("📥 Fetch emails now"):
            try:
                import pipeline
                pipeline.run_once()
                st.success("Mailbox processed")
            except Exception as e:
                st.error(f"Ingestion failed: {e}")
        if o2.button("🚨 Run SLA escalation now"):
            done = sla.auto_escalate()
            st.success(f"Escalated {len(done)} ticket(s)")
        if o3.button("📤 Export Power BI CSVs"):
            import export_powerbi
            st.success(f"Exported to ./{export_powerbi.export()}/")

    with t_cfg:
        st.markdown("Edit these in `db.py` and restart the app.")
        st.markdown("**Category → Team routing**")
        st.table(pd.DataFrame(list(db.TEAM_MAP.items()), columns=["Category", "Team"]))
        st.markdown("**First-response SLA (hours)**")
        st.table(pd.DataFrame(list(db.SLA_HOURS.items()), columns=["Priority", "Hours"]))


# ------------------------------------------------------------------ router
{
    "Dashboard": page_dashboard,
    "Tickets": page_tickets,
    "Attendees": page_attendees,
    "Audit Log": page_audit,
    "Admin": page_admin,
}[page]()
