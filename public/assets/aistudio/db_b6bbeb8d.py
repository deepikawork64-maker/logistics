import sqlite3, os, hashlib, secrets

DB_PATH = os.getenv("DB_PATH", "tickets.db")

# Category -> team mapping (edit freely)
TEAM_MAP = {
    "registration": "Registration Desk",
    "travel": "Travel Team",
    "accommodation": "Hospitality Team",
    "transportation": "Transport Team",
    "venue": "Venue Operations",
    "food": "Catering Team",
    "vip_protocol": "VIP & Protocol Team",
    "general": "General Support",
}
TEAMS = sorted(set(TEAM_MAP.values())) + ["Manual Review"]

STATUSES = ["New", "Assigned", "In Progress", "Responded", "Resolved", "Escalated", "Closed"]
OPEN_STATUSES = ["New", "Assigned", "In Progress", "Escalated"]

# First-response SLA (hours) by priority
SLA_HOURS = {"High": 2, "Medium": 8, "Low": 24}

ROLES = ["admin", "lead", "agent", "viewer"]


def conn():
    c = sqlite3.connect(DB_PATH, timeout=30)
    c.row_factory = sqlite3.Row
    return c


def _add_col(c, table, col, decl):
    cols = [r["name"] for r in c.execute(f"PRAGMA table_info({table})")]
    if col not in cols:
        c.execute(f"ALTER TABLE {table} ADD COLUMN {col} {decl}")


def init():
    c = conn()
    c.executescript(
        """
    CREATE TABLE IF NOT EXISTS attendees(
        email TEXT PRIMARY KEY,
        name TEXT,
        first_seen TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS requests(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT UNIQUE,
        attendee_email TEXT,
        subject TEXT,
        category TEXT,
        summary TEXT,
        priority TEXT,
        confidence REAL,
        status TEXT DEFAULT 'New',
        team TEXT,
        owner TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        assigned_at TEXT,
        responded_at TEXT,
        resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT,
        msg_id TEXT UNIQUE,
        direction TEXT,          -- 'in', 'out' or 'note'
        sender TEXT,
        body TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS status_history(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT,
        old_status TEXT,
        new_status TEXT,
        changed_by TEXT,
        changed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        name TEXT,
        role TEXT,
        team TEXT,
        salt TEXT,
        pw_hash TEXT,
        active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS audit_log(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT DEFAULT CURRENT_TIMESTAMP,
        user TEXT,
        action TEXT,
        request_id TEXT,
        details TEXT
    );
    """
    )
    # migrations for databases created by the earlier version
    _add_col(c, "requests", "escalated_at", "TEXT")
    _add_col(c, "requests", "closed_at", "TEXT")
    _add_col(c, "requests", "escalation_reason", "TEXT")
    c.commit()

    # seed default admin (CHANGE THE PASSWORD after first login)
    if not c.execute("SELECT 1 FROM users").fetchone():
        create_user("admin", "Administrator", os.getenv("ADMIN_PASSWORD", "admin123"), "admin", None, c)
    c.close()


# ---------------------------------------------------------------- users
def hash_pw(password, salt=None):
    salt = salt or secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000).hex()
    return salt, h


def create_user(username, name, password, role, team=None, c=None):
    own = c is None
    c = c or conn()
    salt, h = hash_pw(password)
    c.execute(
        "INSERT INTO users(username,name,role,team,salt,pw_hash) VALUES(?,?,?,?,?,?)",
        (username, name, role, team, salt, h),
    )
    c.commit()
    if own:
        c.close()


def verify_user(username, password):
    c = conn()
    row = c.execute("SELECT * FROM users WHERE username=? AND active=1", (username,)).fetchone()
    c.close()
    if not row:
        return None
    _, h = hash_pw(password, row["salt"])
    return row if secrets.compare_digest(h, row["pw_hash"]) else None


def set_password(username, password):
    salt, h = hash_pw(password)
    c = conn()
    c.execute("UPDATE users SET salt=?, pw_hash=? WHERE username=?", (salt, h, username))
    c.commit()
    c.close()


def set_active(username, active):
    c = conn()
    c.execute("UPDATE users SET active=? WHERE username=?", (1 if active else 0, username))
    c.commit()
    c.close()


def list_users():
    c = conn()
    rows = c.execute("SELECT id,username,name,role,team,active FROM users ORDER BY username").fetchall()
    c.close()
    return rows


# ---------------------------------------------------------------- history
def log_status(c, request_id, old, new, by="system"):
    c.execute(
        "INSERT INTO status_history(request_id,old_status,new_status,changed_by) VALUES(?,?,?,?)",
        (request_id, old, new, by),
    )
