import sqlite3

def init_db(DB_PATH):
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if the users table already exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='auctions'")
    table_exists = cursor.fetchone()
    
    if not table_exists:
        # Create users table
        cursor.execute('''
        CREATE TABLE auctions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            img_url TEXT NOT NULL,
            description TEXT NOT NULL,
            end_date TEXT NOT NULL,
            bid REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        
        # Create transactions table
        cursor.execute('''
        CREATE TABLE challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        )
        ''')
        
        
        print("Database initialized with tables.")
    
    conn.commit()
    conn.close()