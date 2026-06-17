import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def alter_marketing_assets():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE marketing_assets ADD COLUMN video_url VARCHAR;"))
            conn.execute(text("ALTER TABLE marketing_assets ADD COLUMN video_status VARCHAR;"))
            conn.execute(text("ALTER TABLE marketing_assets ADD COLUMN video_job_id VARCHAR;"))
            conn.execute(text("ALTER TABLE marketing_assets ADD COLUMN video_provider VARCHAR;"))
            conn.commit()
        print("Marketing Asset video columns added successfully.")
    except Exception as e:
        print("Error adding video columns:", e)

if __name__ == "__main__":
    alter_marketing_assets()
