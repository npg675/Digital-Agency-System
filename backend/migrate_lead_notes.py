import sqlite3

def migrate():
    try:
        conn = sqlite3.connect("landingforge.db")
        cursor = conn.cursor()
        
        # Add notes column to leads table
        print("Adding 'notes' column to 'leads' table...")
        cursor.execute("ALTER TABLE leads ADD COLUMN notes TEXT;")
        
        conn.commit()
        print("Migration successful.")
    except sqlite3.OperationalError as e:
        print(f"OperationalError: {e} (It may already exist)")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrate()
