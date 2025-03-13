import sqlite3

def init_db(DB_PATH):
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create auctions table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS auctions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        img_url TEXT NOT NULL,
        description TEXT NOT NULL,
        end_date TEXT NOT NULL,
        bid REAL NOT NULL,
        winning_receipt TEXT
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Create challenges table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenge TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    print("Database initialized with tables if they don't exist.")
    
    conn.commit()
    conn.close()
