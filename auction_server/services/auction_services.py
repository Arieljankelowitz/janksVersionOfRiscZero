import sqlite3

def get_all_auctions(DB_PATH):
    """Get all auctions from the database
    
    Args:
        DB_PATH (str): Path to the SQLite database file
        
    Returns:
        list: A list of dictionaries, each containing auction details
    """
    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Execute query to get all auctions
    cursor.execute("SELECT * FROM auctions")
    auctions = cursor.fetchall()
    
    # Close the connection
    conn.close()

    # Convert the query results to a list of dictionaries
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
    """Get a single auction by its ID
    
    Args:
        DB_PATH (str): Path to the SQLite database file
        auction_id (int): The ID of the auction to retrieve
        
    Returns:
        dict: A dictionary containing the auction details if found, None otherwise
    """
    # Print the auction ID for debugging
    print(auction_id)
    
    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Execute parameterized query to prevent SQL injection
    cursor.execute("SELECT * FROM auctions WHERE id = ?", (auction_id,))
    auction = cursor.fetchone()
    
    # Close the connection
    conn.close()

    # If auction exists, convert to dictionary and return
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
    """Create a new auction in the database
    
    Args:
        DB_PATH (str): Path to the SQLite database file
        data (dict): Dictionary containing auction data
            Required keys: title, description, end_date, bid
            Optional keys: img_url
            
    Returns:
        tuple: A response with error message and status code if validation fails
        None: If auction is successfully created
    """
    # Extract data from the input dictionary
    title = data.get('title')
    description = data.get('description')
    end_date = data.get('end_date')
    bid = data.get('bid')
    img_url = data.get('img_url')

    # Validate required fields
    if not title or not description or not end_date or bid is None:
        return jsonify({'error': 'Missing required auction data'}), 400

    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Insert new auction with parameterized query
    cursor.execute('''
        INSERT INTO auctions (title, description, end_date, bid, img_url)
        VALUES (?, ?, ?, ?, ?)
    ''', (title, description, end_date, bid, img_url))
    
    # Commit the transaction and close the connection
    conn.commit()
    conn.close()


def update_auction_bid(DB_PATH, auction_id, new_bid):
    """Update the bid amount of an auction by its ID
    
    Args:
        DB_PATH (str): Path to the SQLite database file
        auction_id (int): The ID of the auction to update
        new_bid (float): The new bid amount to set
    """
    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Update the bid using parameterized query
    cursor.execute("UPDATE auctions SET bid = ? WHERE id = ?", (new_bid, auction_id))
    
    # Commit the transaction and close the connection
    conn.commit()
    conn.close()


def update_winning_receipt(DB_PATH, auction_id, receipt):
    """Update the winning receipt of an auction after it has been won
    
    Args:
        DB_PATH (str): Path to the SQLite database file
        auction_id (int): The ID of the auction to update
        receipt (str): Receipt information to be stored
    """
    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Update the winning receipt using parameterized query
    cursor.execute("UPDATE auctions SET winning_receipt = ? WHERE id = ?", (receipt, auction_id))
    
    # Commit the transaction and close the connection
    conn.commit()
    conn.close()