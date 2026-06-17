from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:admin@localhost:5432/landingforge"

def upgrade():
    engine = create_engine(DATABASE_URL)
    with engine.begin() as conn:
        try:
            conn.exec_driver_sql('ALTER TABLE users ADD COLUMN client_can_generate_ads BOOLEAN DEFAULT FALSE')
            print("Added client_can_generate_ads")
        except Exception as e:
            print("client_can_generate_ads exists or error:", e)

if __name__ == "__main__":
    upgrade()
