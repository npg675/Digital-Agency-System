import sqlite3

def upgrade():
    conn = sqlite3.connect("landingforge.db")
    cursor = conn.cursor()
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN ai_model VARCHAR DEFAULT "gpt-4o-mini" NOT NULL')
    except Exception as e:
        print("ai_model error:", e)

    conn.commit()
    conn.close()
    print("Database altered for ai_model.")

if __name__ == "__main__":
    upgrade()
