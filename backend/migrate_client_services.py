"""
Migration: Create client_services table
"""
import sqlite3

conn = sqlite3.connect('landingforge.db')
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='client_services'")
if cur.fetchone():
    print("INFO: Table 'client_services' already exists, skipping.")
else:
    cur.execute("""
        CREATE TABLE client_services (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            staff_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            service_role TEXT NOT NULL,
            status TEXT DEFAULT 'ACTIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX idx_client_services_client_id ON client_services(client_id)")
    cur.execute("CREATE INDEX idx_client_services_staff_id ON client_services(staff_id)")
    conn.commit()
    print("SUCCESS: Created 'client_services' table.")

conn.close()
