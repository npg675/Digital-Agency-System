from app.database import engine
from sqlalchemy import text

def migrate():
    columns_to_add = [
        "stripe_customer_id VARCHAR",
        "stripe_subscription_id VARCHAR",
        "subscription_status VARCHAR",
        "subscription_tier VARCHAR",
        "agency_stripe_secret_key VARCHAR",
        "agency_stripe_publishable_key VARCHAR"
    ]
    
    with engine.connect() as conn:
        for column in columns_to_add:
            col_name = column.split()[0]
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} VARCHAR;"))
                conn.commit()
                print(f"Successfully added column {col_name}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
                conn.rollback()
        
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
