from sqlalchemy import create_engine, text
from app.core.config import settings

def alter_db():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        try:
            print("Creating quick_links table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS quick_links (
                    id UUID PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    url VARCHAR NOT NULL,
                    category VARCHAR,
                    is_shared_with_staff BOOLEAN NOT NULL DEFAULT FALSE,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            print("quick_links table created.")
            
            # Create indexes
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_quick_links_id ON quick_links (id);"))
            print("Indexes created.")
            
            conn.commit()
        except Exception as e:
            print(f"Error: {e}")
            conn.rollback()

if __name__ == "__main__":
    alter_db()
