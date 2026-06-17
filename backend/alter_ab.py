import os
import sys
# Add current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def main():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE landing_pages ADD COLUMN is_ab_test_active BOOLEAN DEFAULT FALSE NOT NULL;"))
            conn.commit()
        print("is_ab_test_active added successfully")
    except Exception as e:
        print("Error adding is_ab_test_active:", e)
        
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE landing_pages ADD COLUMN variant_name VARCHAR;"))
            conn.commit()
        print("variant_name added successfully")
    except Exception as e:
        print("Error adding variant_name:", e)

if __name__ == "__main__":
    main()
