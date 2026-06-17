import sqlalchemy
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:admin@localhost:5432/landingforge"

def main():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN brand_voice_profile TEXT;"))
            conn.commit()
            print("Successfully added brand_voice_profile to users table.")
        except Exception as e:
            print(f"Error adding column: {e}")

if __name__ == "__main__":
    main()
