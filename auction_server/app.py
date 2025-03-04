from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
from init_db import init_db
import sqlite3
import os

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Database file path
DB_PATH = 'auction.db'

# Initialize the database on startup
init_db(DB_PATH)



def get_all_auctions():
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

def get_auction(auction_id):
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


@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Server API is running"})

@app.route('/api/auction', methods=['POST'])
def create_auction():
    """Create a new auction"""
    # Get auction data from the request
    data = request.get_json()

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

    # Return success response
    return jsonify({'message': 'Auction created successfully'}), 201


# REST: Get all auctions
@app.route('/api/auctions', methods=['GET'])
def get_auctions():
    return get_all_auctions()


@socketio.on('connect')
def handle_connect():
    print('User connected')
    
    # Join all auction rooms
    for auction_id in auctions.keys():
        join_room(f'auction_{auction_id}')
    
    emit('joined_auctions', {'success': True})

# WebSocket: Place a bid on a specific auction
@socketio.on('place_bid')
def handle_place_bid(data):
    auction_id = data.get('auction_id')
    receipt = data.get('receipt')


    bid = verify_receipt(receipt) # create function that wraps rust
    if not bid:
        emit('error', {'message': 'Bid not valid'})
        return

    auction = get_auction(auction_id) #write function
    
    if not auction:
        emit('error', {'message': 'Auction not found'})
        return

    if bid > auction['bid']:
        auction['bid'] = bid
        print(f"Auction {auction_id} new bid: ${bid}")
        # Broadcast to everyone in this auction room
        socketio.emit(
            'bid_update',
            {'auction_id': auction_id, 'new_bid': bid},
            room=f'auction_{auction_id}'
        )
    else:
        emit('error', {'message': 'Bid must be higher than current bid.'})

if __name__ == '__main__':
    print("Bank API starting on http://127.0.0.1:5000")
    print("Database file:", os.path.abspath(DB_PATH))
    socketio.run(app, host='127.0.0.1', port=5000, debug=True)
