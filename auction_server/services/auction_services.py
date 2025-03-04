import sqlite3

def get_all_auctions(DB_PATH):
    """Get all auctions"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM auctions")
    auctions = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row[0],
            "title": row[1],
            "img_url": row[2],
            "description": row[3],
            "end_date": row[4],
            "bid": row[5],
            "created_at": row[6],
            
        }
        for row in auctions
    ]


def get_auction(DB_PATH, auction_id):
    """Get a single auction by its ID"""
    print(auction_id)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM auctions WHERE id = ?", (auction_id,))
    auction = cursor.fetchone()
    conn.close()

    if auction:

        return {
            "id": auction[0],
            "title": auction[1],
            "img_url": auction[2],
            "description": auction[3],
            "end_date": auction[4],
            "bid": auction[5],
            "created_at": auction[6],
            
        }
    else:
        return None  # Return None if the auction does not exist


def create_auction(DB_PATH, data):
    """Create a new auction"""

    title = data.get('title')
    description = data.get('description')
    end_date = data.get('end_date')
    bid = data.get('bid')
    img_url = data.get('img_url')

    # Validate required fields
    if not title or not description or not end_date or bid is None:
        return jsonify({'error': 'Missing required auction data'}), 400

    # Insert auction into the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO auctions (title, description, end_date, bid, img_url)
        VALUES (?, ?, ?, ?, ?)
    ''', (title, description, end_date, bid, img_url))
    
    conn.commit()
    conn.close()