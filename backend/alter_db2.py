import os
import sys
# Add current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def main():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL;"))
        conn.execute(text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;"))
        conn.commit()
    print("Columns altered successfully")

if __name__ == "__main__":
    main()
