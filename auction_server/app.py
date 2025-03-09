from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
from init_db import init_db
import sqlite3
import os
from services.auction_services import get_all_auctions, get_auction, create_auction
from services.challenge_services import create_challenge
import verifier
from reciept import receipt

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Database file path
DB_PATH = 'auction.db'

# Initialize the database on startup
init_db(DB_PATH)

@app.route('/', methods=['GET'])
def home():
    sum = verifier.test("yY4QbuXYeeJSrwVQh1nvl5VJ2OFjuCIg")
    bid = verifier.verify_receipt(receipt)
    return jsonify({"message": sum, "bid": bid})

@app.route('/api/auction', methods=['POST'])
def upload_auction():
    """Create a new auction"""
    # Get auction data from the request
    data = request.get_json()

    try:
        create_auction(DB_PATH, data)
    except Exception as e:
        return jsonify({'message': 'Error creating new auction'}), 500

    return jsonify({'message': 'Auction created successfully'}), 201

@app.route('/api/auction/<auction_id>', methods=['GET'])
def get_auction_id(auction_id):
    # Example response (Replace this with actual DB lookup)
    return get_auction(DB_PATH, auction_id)

# REST: Get all auctions
@app.route('/api/auctions', methods=['GET'])
def get_auctions():
    return get_all_auctions(DB_PATH)


@app.route('/api/challenge', methods=['GET'])
def get_challenge():
    challenge = create_challenge(DB_PATH)

    return jsonify({'challenge': challenge}), 200


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
    print("Auction API starting on http://127.0.0.1:5000")
    print("Database file:", os.path.abspath(DB_PATH))
    socketio.run(app, host='127.0.0.1', port=5001, debug=True)
