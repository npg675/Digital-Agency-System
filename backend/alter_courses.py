from app.database import engine
from app.models.base import Base

print("Creating course tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("Done!")
except Exception as e:
    print(f"Error: {e}")
