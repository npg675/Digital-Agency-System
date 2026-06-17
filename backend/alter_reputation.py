from sqlalchemy import text
from app.database import engine
from app.models.base import Base

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN brand_google_review_url VARCHAR;"))
        print("Added brand_google_review_url to users.")
except Exception as e:
    print(f"Error adding column (it might already exist): {e}")

print("Creating new tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
