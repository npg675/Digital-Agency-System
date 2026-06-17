import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def main():
    try:
        with engine.connect() as conn:
            # Add missing columns safely using IF NOT EXISTS
            queries = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_status VARCHAR DEFAULT 'inactive';",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS agency_stripe_secret_key VARCHAR;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS agency_stripe_publishable_key VARCHAR;"
            ]
            for query in queries:
                conn.execute(text(query))
            conn.commit()
        print("Successfully added missing columns to users table")
    except Exception as e:
        print("Error altering table:", e)

if __name__ == "__main__":
    main()
