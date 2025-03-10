import sqlite3

def init_db(DB_PATH):
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create auctions table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY NOT NULL,
        password TEXT NOT NULL,
        public_key TEXT NOT NULL,
        balance REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    print("Database initialized with tables if they don't exist.")
    
    conn.commit()
    conn.close()
