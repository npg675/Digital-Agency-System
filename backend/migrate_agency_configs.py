import sqlite3
import os

def migrate():
    # Database path
    db_path = os.path.join(os.path.dirname(__file__), 'landingforge.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_to_add = [
        "agency_address VARCHAR",
        "agency_email VARCHAR",
        "agency_profile_text VARCHAR"
    ]

    for column in columns_to_add:
        col_name = column.split()[0]
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {column}")
            print(f"Successfully added column {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column {col_name} already exists. Skipping.")
            else:
                print(f"Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
