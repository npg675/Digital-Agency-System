"""
Migration: Create handover_requests table
"""
import sqlite3

conn = sqlite3.connect('landingforge.db')
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='handover_requests'")
if cur.fetchone():
    print("INFO: Table 'handover_requests' already exists, skipping.")
else:
    cur.execute("""
        CREATE TABLE handover_requests (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            requested_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            new_manager_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reason TEXT,
            status TEXT NOT NULL DEFAULT 'PENDING',
            admin_note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    print("SUCCESS: Created 'handover_requests' table.")

conn.close()
