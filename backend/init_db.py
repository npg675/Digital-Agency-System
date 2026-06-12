from app.database import SessionLocal, engine
from app.models.base import Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash

# Ensure all tables are created
Base.metadata.create_all(bind=engine)

db = SessionLocal()

admin = db.query(User).filter(User.email == "admin@landingforge.com").first()
if not admin:
    admin = User(
        email="admin@landingforge.com",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.ADMIN
    )
    db.add(admin)
    db.commit()
    print("Admin user created: admin@landingforge.com / admin123")
else:
    print("Admin user already exists.")
