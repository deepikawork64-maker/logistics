# Event Communication & Request Management System

Email-driven ticketing for large events. Attendee emails to a dedicated Gmail inbox become tracked tickets
(auto category, summary, priority, assignment, acknowledgement, SLA escalation) with a Streamlit agent app
and Power BI dashboard feed. Entire stack is free.

## Components
| File | Purpose |
|---|---|
| `pipeline.py` | Reads Gmail (IMAP), creates tickets, threads replies via `[REQ-xxxxx]`, Gemini classification, auto-acknowledgement |
| `worker.py` | Background loop: ingest -> SLA auto-escalation -> refresh Power BI CSVs (every 60s) |
| `app.py` | Streamlit app: login + roles, dashboard, tickets, reply/assign/escalate/resolve, attendees, audit log, admin |
| `services.py` | Business logic (status, assignment, replies, notes, audit) |
| `sla.py` | Overdue / unassigned logic, response-time metrics |
| `export_powerbi.py` | Writes CSVs to `powerbi_data/` for Power BI |
| `seed_demo.py` | Dummy data for testing without emails |
| `db.py` | SQLite schema, routing map (`TEAM_MAP`), SLA hours (`SLA_HOURS`), users |

## Setup
1. Create a NEW Gmail for the event. Turn on 2-Step Verification, create an App Password, enable IMAP.
2. `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and fill values (Gmail, app password, Gemini key, event name).
4. `python seed_demo.py 80`  (optional dummy data)
5. Terminal 1: `python worker.py`
6. Terminal 2: `streamlit run app.py`
7. Login `admin / admin123` -> change the password immediately -> create users in Admin.

## Roles
- admin: everything + user management
- lead: all tickets, assign, escalate, audit log
- agent: tickets of own team or assigned to them; reply, note, status, escalate
- viewer: read-only dashboard/tickets

## Ticket statuses
New, Assigned, In Progress, Responded, Resolved, Escalated, Closed. Every change is stored in `status_history` and `audit_log`.

## SLA
First-response SLA by priority in `db.SLA_HOURS` (High 2h, Medium 8h, Low 24h). Open tickets with no response past SLA
are flagged Overdue and auto-escalated by the worker.

## Power BI
Power BI Desktop -> Get Data -> Folder (or Text/CSV) -> `powerbi_data/`. Use `requests.csv` as the main table
(`created_date`, `category`, `status`, `team`, `is_overdue`, `is_unassigned`, `first_response_hrs`, `resolution_hrs`).
Refresh to update. Message bodies are not exported (PII).

## Known limits (free tier)
- Gmail personal: about 500 sent emails/day. Acknowledgements for 2,000+ attendees need Workspace or an SMTP service
  (Brevo, SendGrid) -> change `send_mail` in `pipeline.py` only.
- Free Gemini tier: rate limits, and inputs may be used for training. Use dummy data until the client approves.
  Keyword fallback runs automatically if the API fails.
- SQLite is fine for one event team. For many concurrent users move to PostgreSQL.
- Attachments are not processed. One email = one ticket.
