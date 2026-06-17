from app.database import engine
from app.models.base import Base

print("Creating social_integrations table if it doesn't exist...")
Base.metadata.create_all(bind=engine)
print("Done!")
