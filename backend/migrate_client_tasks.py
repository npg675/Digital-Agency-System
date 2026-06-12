"""
Migration: Create client_tasks table
"""
import sqlite3

conn = sqlite3.connect('landingforge.db')
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='client_tasks'")
if cur.fetchone():
    print("INFO: Table 'client_tasks' already exists, skipping.")
else:
    cur.execute("""
        CREATE TABLE client_tasks (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            assigned_to_id TEXT REFERENCES users(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'TODO',
            service_category TEXT,
            due_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX idx_client_tasks_client_id ON client_tasks(client_id)")
    cur.execute("CREATE INDEX idx_client_tasks_assigned_to_id ON client_tasks(assigned_to_id)")
    conn.commit()
    print("SUCCESS: Created 'client_tasks' table.")

conn.close()
