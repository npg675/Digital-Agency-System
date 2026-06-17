import os
import sys
# Add current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def main():
    try:
        with engine.connect() as conn:
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS inbox_messages (
                id UUID PRIMARY KEY,
                lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
                direction VARCHAR NOT NULL,
                channel VARCHAR NOT NULL,
                content TEXT NOT NULL,
                status VARCHAR NOT NULL DEFAULT 'SENT',
                sent_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
            );
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_inbox_messages_id ON inbox_messages (id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_inbox_messages_sent_at ON inbox_messages (sent_at);"))
            conn.commit()
        print("inbox_messages table created successfully")
    except Exception as e:
        print("Error creating inbox_messages:", e)

if __name__ == "__main__":
    main()
