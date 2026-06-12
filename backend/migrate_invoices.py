import sqlite3

conn = sqlite3.connect('landingforge.db')
cur = conn.cursor()

# Create invoices table
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'")
if cur.fetchone():
    print("INFO: Table 'invoices' already exists, skipping.")
else:
    cur.execute("""
        CREATE TABLE invoices (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'usd',
            status TEXT DEFAULT 'DRAFT',
            description TEXT,
            due_date DATETIME,
            stripe_payment_intent_id TEXT,
            stripe_checkout_session_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX idx_invoices_client_id ON invoices(client_id)")
    print("SUCCESS: Created 'invoices' table.")

conn.commit()
conn.close()
