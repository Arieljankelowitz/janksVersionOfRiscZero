from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
from init_db import init_db
import os
from services.auction_services import get_all_auctions, get_auction, create_auction, update_auction_bid
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
    # sum = verifier.test("yY4QbuXYeeJSrwVQh1nvl5VJ2OFjuCIg")
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
    auctions = get_all_auctions(DB_PATH)
    # Join all auction rooms
    for auction in auctions:
        join_room(f'auction_{auction["id"]}')
    
    emit('joined_auctions', {'success': True})

# WebSocket: Place a bid on a specific auction
@socketio.on('place_bid')
def handle_place_bid(data):
    auction_id = data.get('auction_id')
    receipt = data.get('receipt')

    def write_to_file(file_path: str, data: str):
        try:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(data)
                print("File written successfully")
        except Exception as e:
            print(f"Error writing to file: {e}")

    write_to_file("receipt.txt", receipt)

    try:
        bid = verifier.verify_receipt(receipt)
    except Exception as e:
        # Handle the exception, print the error or do something else
        emit('error', {'message': f"Error verifying receipt: {e}"})
        return
    # bid = 160 # TODO get rid of this and change to  verify receipt


    auction = get_auction(DB_PATH, auction_id) #write function
    
    if not auction:
        emit('error', {'message': 'Auction not found'})
        return

    if bid > auction['bid']:
        update_auction_bid(DB_PATH, auction_id, bid)
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
    print("Auction API starting on http://127.0.0.1:5001")
    print("Database file:", os.path.abspath(DB_PATH))
    socketio.run(app, host='127.0.0.1', port=5001, debug=True)
