import os
import sys
# Add current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def main():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN address VARCHAR;"))
        conn.commit()
    print("Column added successfully")

if __name__ == "__main__":
    main()
