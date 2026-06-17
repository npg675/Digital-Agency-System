from app.database import engine
from sqlalchemy import text

def migrate():
    columns_to_add = [
        "autoresponder_subject VARCHAR",
        "autoresponder_body VARCHAR",
        "default_sequence_id UUID",
        "status VARCHAR DEFAULT 'DRAFT'",
        "is_ab_test_primary BOOLEAN DEFAULT FALSE",
        "ab_test_variant_of_id UUID",
        "ab_test_auto_optimize BOOLEAN DEFAULT TRUE",
        "ab_test_traffic_weight INTEGER DEFAULT 50",
        "language_code VARCHAR DEFAULT 'en'",
        "translation_of_id UUID"
    ]
    
    with engine.connect() as conn:
        for column in columns_to_add:
            col_name = column.split()[0]
            try:
                conn.execute(text(f"ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS {column};"))
                conn.commit()
                print(f"Successfully added column {col_name}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
                conn.rollback()
        
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
