import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def main():
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users'"))
            columns = [r[0] for r in res]
            print("Columns in users table:")
            print(columns)
            
            missing = [
                "stripe_customer_id",
                "stripe_subscription_id",
                "stripe_subscription_status",
                "subscription_tier",
                "agency_stripe_secret_key",
                "agency_stripe_publishable_key"
            ]
            
            for m in missing:
                if m not in columns:
                    print(f"Adding missing column: {m}")
                    if m == "stripe_subscription_status":
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {m} VARCHAR DEFAULT 'inactive'"))
                    else:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {m} VARCHAR"))
            conn.commit()
            print("Done checking and fixing columns.")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
