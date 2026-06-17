import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

def alter_db():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN brand_stripe_secret_key VARCHAR;"))
            print("Added brand_stripe_secret_key")
        except Exception as e:
            print(e)
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN brand_stripe_publishable_key VARCHAR;"))
            print("Added brand_stripe_publishable_key")
        except Exception as e:
            print(e)
            
        conn.commit()

if __name__ == "__main__":
    alter_db()
