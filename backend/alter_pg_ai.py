from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:admin@localhost:5432/landingforge"

def upgrade():
    engine = create_engine(DATABASE_URL)
    with engine.begin() as conn:
        try:
            conn.exec_driver_sql('ALTER TABLE users ADD COLUMN ai_provider VARCHAR DEFAULT \'openai\' NOT NULL')
            print("Added ai_provider")
        except Exception as e:
            print("ai_provider exists or error:", e)

        try:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN gemini_api_key VARCHAR")
            print("Added gemini_api_key")
        except Exception as e:
            print("gemini_api_key exists or error:", e)

        try:
            conn.exec_driver_sql('ALTER TABLE users ADD COLUMN ai_model VARCHAR DEFAULT \'gpt-4o-mini\' NOT NULL')
            print("Added ai_model")
        except Exception as e:
            print("ai_model exists or error:", e)

    print("Postgres database altered.")

if __name__ == "__main__":
    upgrade()
