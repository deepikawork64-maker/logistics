"""Fills the database with DUMMY tickets so you can test the app and Power BI without sending emails.
Usage: python seed_demo.py [count]     (default 80)
"""
import random, sys
from datetime import datetime, timedelta, timezone
import db, services

random.seed(7)
N = int(sys.argv[1]) if len(sys.argv) > 1 else 80

SAMPLES = {
    "registration": ["Not received my registration confirmation", "Need to change name on badge", "Unable to register, form error"],
    "travel": ["Flight rescheduled, need help with arrival", "Need train ticket assistance from Delhi", "Travel itinerary query"],
    "accommodation": ["Hotel room not allotted yet", "Need early check-in at hotel", "Request for extra night stay"],
    "transportation": ["Airport pickup required on arrival", "Shuttle timings between hotel and venue?", "Cab drop needed after event"],
    "venue": ["Parking details for the venue", "Seating arrangement for my delegation", "Venue entry gate information"],
    "food": ["Need vegetarian meals", "Jain food requirement", "Food allergy - please note"],
    "vip_protocol": ["VIP delegation arriving, need protocol support", "Secretary-level delegate - protocol request", "CEO arrival, security arrangement"],
    "general": ["General query about event agenda", "Who to contact on event day?", "Is there a dress code?"],
}
WEIGHTS = {"registration": 20, "travel": 18, "accommodation": 15, "transportation": 14,
           "venue": 8, "food": 8, "vip_protocol": 6, "general": 11}
FIRST = ["Aarav", "Priya", "Rohan", "Neha", "Vikram", "Ananya", "Karan", "Sneha", "Rahul", "Pooja", "Amit", "Divya"]
LAST = ["Sharma", "Verma", "Patel", "Singh", "Gupta", "Joshi", "Mehta", "Iyer", "Nair", "Reddy"]
AGENTS = {}

def ts(dt):
    return dt.strftime("%Y-%m-%d %H:%M:%S")

db.init()
c = db.conn()

# demo staff
for team in db.TEAMS:
    uname = team.split()[0].lower() + "_agent"
    try:
        db.create_user(uname, f"{team} Agent", "agent123", "agent", team)
    except Exception:
        pass
    AGENTS[team] = uname
try:
    db.create_user("lead", "Event Lead", "lead123", "lead", None)
    db.create_user("viewer", "Management Viewer", "viewer123", "viewer", None)
except Exception:
    pass

now = datetime.now(timezone.utc).replace(tzinfo=None)
for i in range(N):
    cat = random.choices(list(WEIGHTS), weights=list(WEIGHTS.values()))[0]
    subject = random.choice(SAMPLES[cat])
    fn, ln = random.choice(FIRST), random.choice(LAST)
    email = f"{fn.lower()}.{ln.lower()}{random.randint(1, 99)}@example.com"
    created = now - timedelta(hours=random.uniform(0.2, 96))
    prio = "High" if cat == "vip_protocol" or random.random() < 0.12 else random.choice(["Medium", "Medium", "Low"])
    team = db.TEAM_MAP[cat]
    conf = round(random.uniform(0.45, 0.98), 2)
    if conf < 0.6:
        team = "Manual Review"
    status = random.choices(
        ["New", "Assigned", "In Progress", "Responded", "Resolved", "Closed", "Escalated"],
        weights=[8, 14, 14, 18, 24, 12, 10])[0]
    if team == "Manual Review" and status != "New":
        team = db.TEAM_MAP[cat]
    if status in ("New", "Assigned", "In Progress"):
        # open tickets are mostly recent, a few breach SLA
        created = now - timedelta(hours=random.uniform(0.2, 14))

    c.execute("INSERT OR IGNORE INTO attendees(email,name,first_seen) VALUES(?,?,?)", (email, f"{fn} {ln}", ts(created)))
    cur = c.execute(
        """INSERT INTO requests(attendee_email,subject,category,summary,priority,confidence,status,team,created_at)
           VALUES(?,?,?,?,?,?,?,?,?)""",
        (email, subject, cat, f"Attendee asks: {subject.lower()}.", prio, conf, status, team, ts(created)))
    rid = f"REQ-{cur.lastrowid:05d}"
    c.execute("UPDATE requests SET request_id=? WHERE id=?", (rid, cur.lastrowid))
    c.execute("INSERT INTO messages(request_id,msg_id,direction,sender,body,created_at) VALUES(?,?,?,?,?,?)",
              (rid, f"<seed-in-{rid}@demo>", "in", email, f"Hello team,\n\n{subject}. Please help.\n\nThanks,\n{fn}", ts(created)))
    c.execute("INSERT INTO messages(request_id,msg_id,direction,sender,body,created_at) VALUES(?,?,?,?,?,?)",
              (rid, f"<seed-ack-{rid}@demo>", "out", "event-desk", f"Your Request ID is {rid}.", ts(created + timedelta(seconds=20))))
    db.log_status(c, rid, None, "New", "system")

    if status != "New":
        t_assign = created + timedelta(minutes=random.randint(1, 40))
        c.execute("UPDATE requests SET assigned_at=?, owner=? WHERE request_id=?",
                  (ts(t_assign), AGENTS.get(team), rid))
        db.log_status(c, rid, "New", "Assigned", "auto-assign")
    if status in ("Responded", "Resolved", "Closed", "In Progress"):
        t_resp = created + timedelta(hours=random.uniform(0.2, 12))
        if status != "In Progress":
            c.execute("UPDATE requests SET responded_at=? WHERE request_id=?", (ts(t_resp), rid))
            c.execute("INSERT INTO messages(request_id,msg_id,direction,sender,body,created_at) VALUES(?,?,?,?,?,?)",
                      (rid, f"<seed-out-{rid}@demo>", "out", "event-desk", "We have arranged this for you. Regards, Event Team", ts(t_resp)))
            db.log_status(c, rid, "Assigned", "Responded", AGENTS.get(team, "agent"))
    if status in ("Resolved", "Closed"):
        t_res = created + timedelta(hours=random.uniform(1, 30))
        c.execute("UPDATE requests SET resolved_at=?, responded_at=COALESCE(responded_at, ?) WHERE request_id=?",
                  (ts(t_res), ts(t_res), rid))
        if status == "Closed":
            c.execute("UPDATE requests SET closed_at=? WHERE request_id=?", (ts(t_res), rid))
        db.log_status(c, rid, "Responded", status, AGENTS.get(team, "agent"))
    if status == "Escalated":
        c.execute("UPDATE requests SET escalated_at=?, escalation_reason=? WHERE request_id=?",
                  (ts(created + timedelta(hours=3)), "SLA breached (no response in time)", rid))
        db.log_status(c, rid, "Assigned", "Escalated", "system")
    services.audit(c, "system", "seed_demo", rid, "dummy data")

c.commit()
c.close()
print(f"Seeded {N} dummy tickets. Logins -> admin/admin123, lead/lead123, viewer/viewer123, <team>_agent/agent123")
