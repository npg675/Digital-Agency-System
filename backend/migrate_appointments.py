import sqlite3

conn = sqlite3.connect('landingforge.db')
cur = conn.cursor()

# 1. Create appointments table
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='appointments'")
if cur.fetchone():
    print("INFO: Table 'appointments' already exists, skipping.")
else:
    cur.execute("""
        CREATE TABLE appointments (
            id TEXT PRIMARY KEY,
            host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            client_id TEXT REFERENCES users(id) ON DELETE SET NULL,
            lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            description TEXT,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            status TEXT DEFAULT 'SCHEDULED',
            meeting_link TEXT,
            google_event_id TEXT,
            reminder_1h_sent BOOLEAN DEFAULT 0,
            reminder_24h_sent BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX idx_appointments_host_id ON appointments(host_id)")
    cur.execute("CREATE INDEX idx_appointments_client_id ON appointments(client_id)")
    cur.execute("CREATE INDEX idx_appointments_lead_id ON appointments(lead_id)")
    print("SUCCESS: Created 'appointments' table.")

# 2. Add columns to leads table
try:
    cur.execute("ALTER TABLE leads ADD COLUMN next_followup_date DATETIME")
    print("SUCCESS: Added next_followup_date to leads.")
except sqlite3.OperationalError as e:
    print("INFO: leads.next_followup_date might already exist:", e)

try:
    cur.execute("ALTER TABLE leads ADD COLUMN followup_status TEXT DEFAULT 'PENDING'")
    print("SUCCESS: Added followup_status to leads.")
except sqlite3.OperationalError as e:
    print("INFO: leads.followup_status might already exist:", e)

# 3. Add columns to users table
try:
    cur.execute("ALTER TABLE users ADD COLUMN google_access_token TEXT")
    print("SUCCESS: Added google_access_token to users.")
except sqlite3.OperationalError as e:
    print("INFO: users.google_access_token might already exist:", e)

try:
    cur.execute("ALTER TABLE users ADD COLUMN google_refresh_token TEXT")
    print("SUCCESS: Added google_refresh_token to users.")
except sqlite3.OperationalError as e:
    print("INFO: users.google_refresh_token might already exist:", e)

try:
    cur.execute("ALTER TABLE users ADD COLUMN google_token_expiry DATETIME")
    print("SUCCESS: Added google_token_expiry to users.")
except sqlite3.OperationalError as e:
    print("INFO: users.google_token_expiry might already exist:", e)

conn.commit()
conn.close()
