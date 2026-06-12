"""
Migration: Create activity_logs table
"""
import sqlite3

conn = sqlite3.connect('landingforge.db')
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='activity_logs'")
if cur.fetchone():
    print("INFO: Table 'activity_logs' already exists, skipping.")
else:
    cur.execute("""
        CREATE TABLE activity_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id TEXT,
            details TEXT NOT NULL,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX idx_activity_logs_action ON activity_logs(action)")
    conn.commit()
    print("SUCCESS: Created 'activity_logs' table.")

conn.close()
