from sqlalchemy import create_engine, text
from app.core.config import settings

def alter_leads_table():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE leads ADD COLUMN ai_score VARCHAR;"))
            print("Added ai_score column")
        except Exception as e:
            print(f"Skipping ai_score: {e}")
            
        try:
            conn.execute(text("ALTER TABLE leads ADD COLUMN ai_score_reason VARCHAR;"))
            print("Added ai_score_reason column")
        except Exception as e:
            print(f"Skipping ai_score_reason: {e}")
            
        conn.commit()

if __name__ == "__main__":
    alter_leads_table()
