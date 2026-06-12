import sqlite3

conn = sqlite3.connect('landingforge.db')
cur = conn.cursor()

# Check if column already exists
cur.execute("PRAGMA table_info(client_notes)")
cols = [row[1] for row in cur.fetchall()]
print("Existing columns:", cols)

if 'is_internal' not in cols:
    cur.execute("ALTER TABLE client_notes ADD COLUMN is_internal INTEGER NOT NULL DEFAULT 0")
    conn.commit()
    print("SUCCESS: Added 'is_internal' column to client_notes table.")
else:
    print("INFO: Column 'is_internal' already exists, skipping migration.")

conn.close()
