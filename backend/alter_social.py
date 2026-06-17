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
            CREATE TABLE IF NOT EXISTS social_posts (
                id UUID PRIMARY KEY,
                client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                media_url VARCHAR,
                platforms VARCHAR NOT NULL,
                scheduled_for TIMESTAMP WITHOUT TIME ZONE NOT NULL,
                status VARCHAR NOT NULL DEFAULT 'SCHEDULED',
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
            );
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_social_posts_id ON social_posts (id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_social_posts_scheduled_for ON social_posts (scheduled_for);"))
            conn.commit()
        print("social_posts table created successfully")
    except Exception as e:
        print("Error creating social_posts:", e)

if __name__ == "__main__":
    main()
