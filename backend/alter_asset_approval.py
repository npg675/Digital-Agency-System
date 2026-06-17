import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def alter_marketing_assets():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE marketing_assets ADD COLUMN approval_status VARCHAR;"))
            conn.execute(text("ALTER TABLE marketing_assets ADD COLUMN approval_note TEXT;"))
            conn.commit()
        print("Marketing Asset approval columns added successfully.")
    except Exception as e:
        print("Error adding approval columns:", e)

if __name__ == "__main__":
    alter_marketing_assets()
