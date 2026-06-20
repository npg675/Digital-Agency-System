"""
Run this script once to add the video upload settings columns to the users table.
Usage: cd backend && python alter_video_upload_settings.py
"""
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:admin@localhost:5432/landingforge")
engine = create_engine(DATABASE_URL)

COLUMNS = [
    ("video_storage_provider", "VARCHAR DEFAULT 'local' NOT NULL"),
    ("video_upload_local_path", "VARCHAR DEFAULT 'public/uploads'"),
    ("video_export_path", "VARCHAR DEFAULT 'uploads/videos'"),
    ("google_drive_folder_id",  "VARCHAR"),
    ("google_drive_credentials", "VARCHAR"),
]

with engine.connect() as conn:
    for col_name, col_def in COLUMNS:
        try:
            conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_def}"))
            conn.commit()
            print(f"[OK] Column '{col_name}' added (or already exists).")
        except Exception as e:
            conn.rollback()
            print(f"[WARN] Could not add '{col_name}': {e}")

print("\nDone. Video upload settings columns are ready.")

