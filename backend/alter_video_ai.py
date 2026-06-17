import os
import sys
# Add current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def add_columns():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN heygen_api_key VARCHAR;"))
            conn.commit()
        print("heygen_api_key added successfully.")
    except Exception as e:
        print("Error adding heygen_api_key:", e)
        
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN synthesia_api_key VARCHAR;"))
            conn.commit()
        print("synthesia_api_key added successfully.")
    except Exception as e:
        print("Error adding synthesia_api_key:", e)
        
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN runway_api_key VARCHAR;"))
            conn.commit()
        print("runway_api_key added successfully.")
    except Exception as e:
        print("Error adding runway_api_key:", e)

if __name__ == "__main__":
    add_columns()
