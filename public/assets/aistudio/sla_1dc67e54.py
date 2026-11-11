"""SLA / overdue logic and the enriched requests DataFrame (used by dashboard + Power BI export)."""
import pandas as pd
import db, services

TS_COLS = ["created_at", "assigned_at", "responded_at", "resolved_at", "escalated_at", "closed_at"]
TZ = "Asia/Kolkata"


def _to_local(series):
    s = pd.to_datetime(series, errors="coerce", utc=True)
    return s.dt.tz_convert(TZ).dt.tz_localize(None)


def load_requests():
    c = db.conn()
    df = pd.read_sql_query("SELECT * FROM requests", c)
    c.close()

    for col in TS_COLS:
        df[col] = _to_local(df[col])

    now = pd.Timestamp.now(tz=TZ).tz_localize(None)
    df["sla_hours"] = df["priority"].map(db.SLA_HOURS).fillna(8)
    df["age_hours"] = ((now - df["created_at"]).dt.total_seconds() / 3600).round(1)
    df["is_open"] = df["status"].isin(db.OPEN_STATUSES)

    no_owner = df["owner"].isna() | (df["owner"] == "")
    df["is_unassigned"] = df["is_open"] & ((df["status"] == "New") | (df["team"] == "Manual Review") | df["team"].isna())
    df["no_owner"] = df["is_open"] & no_owner

    # overdue = still waiting for first response and past SLA
    df["is_overdue"] = df["is_open"] & df["responded_at"].isna() & (df["age_hours"] > df["sla_hours"])

    df["first_response_hrs"] = ((df["responded_at"] - df["created_at"]).dt.total_seconds() / 3600).round(2)
    df["resolution_hrs"] = ((df["resolved_at"] - df["created_at"]).dt.total_seconds() / 3600).round(2)
    return df


def auto_escalate(user="system"):
    """Escalate every overdue ticket that is not already escalated. Returns list of request ids."""
    df = load_requests()
    todo = df[df["is_overdue"] & (df["status"] != "Escalated")]["request_id"].tolist()
    if not todo:
        return []
    c = db.conn()
    for rid in todo:
        services.set_status(c, rid, "Escalated", user, "SLA breached (no response in time)")
    c.close()
    return todo
