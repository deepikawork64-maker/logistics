"""Exports CSVs for Power BI (Get Data -> Folder, or individual CSVs)."""
import os
import pandas as pd
import db, sla


def export(folder="powerbi_data"):
    os.makedirs(folder, exist_ok=True)
    df = sla.load_requests()
    df["created_date"] = df["created_at"].dt.date
    df.to_csv(f"{folder}/requests.csv", index=False, encoding="utf-8-sig")

    c = db.conn()
    queries = {
        # message bodies are intentionally NOT exported (PII)
        "messages": "SELECT id,request_id,direction,sender,created_at FROM messages",
        "status_history": "SELECT * FROM status_history",
        "attendees": "SELECT * FROM attendees",
        "audit_log": "SELECT * FROM audit_log",
    }
    for name, q in queries.items():
        pd.read_sql_query(q, c).to_csv(f"{folder}/{name}.csv", index=False, encoding="utf-8-sig")
    c.close()
    return folder


if __name__ == "__main__":
    db.init()
    print("Exported to", export())
