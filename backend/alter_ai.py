import os
import sys
# Add current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def main():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN openai_api_key VARCHAR;"))
            conn.commit()
        print("openai_api_key added to users successfully")
    except Exception as e:
        print("Error adding openai_api_key:", e)

    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN ai_auto_respond_enabled BOOLEAN DEFAULT FALSE NOT NULL;"))
            conn.commit()
        print("ai_auto_respond_enabled added to users successfully")
    except Exception as e:
        print("Error adding ai_auto_respond_enabled:", e)
        
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE landing_pages ADD COLUMN ai_system_prompt VARCHAR;"))
            conn.commit()
        print("ai_system_prompt added to landing_pages successfully")
    except Exception as e:
        print("Error adding ai_system_prompt:", e)

if __name__ == "__main__":
    main()
