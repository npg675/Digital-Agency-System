import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def main():
    try:
        with engine.connect() as conn:
            query = """
            CREATE TABLE IF NOT EXISTS personal_notes (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                title VARCHAR NOT NULL,
                content TEXT,
                url VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
            conn.execute(text(query))
            conn.commit()
        print("Successfully created personal_notes table")
    except Exception as e:
        print("Error creating table:", e)

if __name__ == "__main__":
    main()
