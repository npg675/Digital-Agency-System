import sqlite3

def upgrade():
    conn = sqlite3.connect("landingforge.db")
    cursor = conn.cursor()
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN ai_provider VARCHAR DEFAULT "openai" NOT NULL')
    except Exception as e:
        print("ai_provider error:", e)

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN gemini_api_key VARCHAR")
    except Exception as e:
        print("gemini_api_key error:", e)

    conn.commit()
    conn.close()
    print("Database altered.")

if __name__ == "__main__":
    upgrade()
