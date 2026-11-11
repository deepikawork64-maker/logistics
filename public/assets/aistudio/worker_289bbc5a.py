"""Background worker: ingest emails -> escalate overdue -> refresh Power BI CSVs.
Run in a separate terminal:  python worker.py
"""
import time
import db, pipeline, sla, export_powerbi

INTERVAL = 60  # seconds

if __name__ == "__main__":
    db.init()
    print("Worker started. Ctrl+C to stop.")
    while True:
        try:
            pipeline.run_once()
            esc = sla.auto_escalate()
            if esc:
                print("Auto-escalated:", ", ".join(esc))
            export_powerbi.export()
        except Exception as e:
            print("worker error:", e)
        time.sleep(INTERVAL)
