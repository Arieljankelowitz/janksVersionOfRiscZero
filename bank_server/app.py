from flask import Flask, jsonify, request
from flask_cors import CORS
import hashlib
import json
import uuid
import sqlite3
import os
import secrets
import binascii
import random
import string
import datetime
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

app = Flask(__name__)
CORS(app)

# Database file path
DB_PATH = 'bank.db'

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if the users table already exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    table_exists = cursor.fetchone()
    
    if not table_exists:
        # Create users table
        cursor.execute('''
        CREATE TABLE users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            public_key TEXT NOT NULL,
            balance REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create transactions table
        cursor.execute('''
        CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            receipt TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (username) REFERENCES users(username)
        )
        ''')
        
        # Create sessions table
        cursor.execute('''
        CREATE TABLE sessions (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (username) REFERENCES users(username)
        )
        ''')
        
        print("Database initialized with tables.")
    
    conn.commit()
    conn.close()

# Initialize the database on startup
init_db()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token():
    return str(uuid.uuid4())

def simple_sign(data_str):
    signature = hashlib.sha256(data_str.encode() + b"bank_secret_key").hexdigest()
    return signature

def generate_key_pair():
    """Generate a SECP256K1 key pair"""
    # Generate a private key using the SECP256K1 curve (same as Bitcoin/Ethereum)
    private_key = ec.generate_private_key(ec.SECP256K1())
    
    # Get the public key
    public_key = private_key.public_key()
    
    # Serialize the private key to bytes and convert to hex
    private_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    private_hex = binascii.hexlify(private_bytes).decode('ascii')
    
    # Serialize the public key to bytes and convert to hex
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    public_hex = binascii.hexlify(public_bytes).decode('ascii')
    
    return private_hex, public_hex

def get_user_data(username):
    """Get user data from the database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT username, password_hash, public_key, balance FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return {
            "username": user[0],
            "password_hash": user[1],
            "public_key": user[2],
            "balance": user[3]
        }
    return None

def get_user_transactions(username):
    """Get all transactions for a user"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT receipt FROM transactions WHERE username = ? ORDER BY created_at DESC", (username,))
    transactions = cursor.fetchall()
    conn.close()
    
    return [json.loads(t[0]) for t in transactions]

def store_transaction(username, receipt):
    """Store a transaction in the database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO transactions (username, receipt) VALUES (?, ?)", 
                  (username, json.dumps(receipt)))
    conn.commit()
    conn.close()

def generate_signed_receipt(username):
    """Generate a signed receipt for a user's balance."""
    user = get_user_data(username)
    if not user:
        return None
    
    cert = {
        "date": "2024-07-08",  # This should be dynamic in a real app
        "balance": user["balance"],
        "client_public_key": user["public_key"]  # Using the stored public key
    }
    
    cert_json = json.dumps(cert, sort_keys=True)
    signature = simple_sign(cert_json)
    
    signed_receipt = {
        "cert": cert,
        "bank_sig": signature,
        "bank_public_key": "bank123456789"
    }
    
    # Store receipt in user's transaction history
    store_transaction(username, signed_receipt)
    
    return signed_receipt

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Bank API is running"})

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    if not all(key in data for key in ['username', 'password', 'initial_balance']):
        return jsonify({"error": "Missing required fields"}), 400
    
    username = data['username']
    
    # Check if user already exists
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE username = ?", (username,))
    existing_user = cursor.fetchone()
    if existing_user:
        conn.close()
        return jsonify({"error": "User already exists"}), 400
    
    # Generate a key pair for the user
    private_key, public_key = generate_key_pair()
    
    # Store user in database
    password_hash = hash_password(data['password'])
    cursor.execute(
        "INSERT INTO users (username, password_hash, public_key, balance) VALUES (?, ?, ?, ?)",
        (username, password_hash, public_key, data['initial_balance'])
    )
    conn.commit()
    conn.close()

    # Generate a signed receipt upon signup
    receipt = generate_signed_receipt(username)

    # Return the private key for the user to save
    return jsonify({
        "message": "User registered successfully", 
        "receipt": receipt,
        "private_key": private_key
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not all(key in data for key in ['username', 'password']):
        return jsonify({"error": "Missing required fields"}), 400
    
    username = data['username']
    user = get_user_data(username)
    
    if not user or user['password_hash'] != hash_password(data['password']):
        return jsonify({"error": "Invalid username or password"}), 401
    
    # Generate a token and store in sessions table
    token = generate_token()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO sessions (token, username) VALUES (?, ?)", (token, username))
    conn.commit()
    conn.close()
    
    # Generate a signed receipt upon login
    receipt = generate_signed_receipt(username)

    return jsonify({"message": "Login successful", "token": token, "receipt": receipt})

@app.route('/api/receipts', methods=['GET'])
def get_receipts():
    token = request.headers.get("Authorization")
    
    if not token:
        return jsonify({"error": "No token provided"}), 401
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM sessions WHERE token = ?", (token,))
    session = cursor.fetchone()
    conn.close()
    
    if not session:
        return jsonify({"error": "Invalid or expired token"}), 401
        
    username = session[0]
    transactions = get_user_transactions(username)
    
    return jsonify({"receipts": transactions})

@app.route('/api/sign_bid', methods=['POST'])
def sign_bid():
    token = request.headers.get("Authorization")
    
    if not token:
        return jsonify({"error": "No token provided"}), 401
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM sessions WHERE token = ?", (token,))
    session = cursor.fetchone()
    conn.close()
    
    if not session:
        return jsonify({"error": "Invalid or expired token"}), 401
        
    username = session[0]
    
    data = request.json
    if not all(key in data for key in ['date', 'balance', 'client_public_key']):
        return jsonify({"error": "Missing required fields"}), 400
    
    cert = {
        "date": data['date'],
        "balance": data['balance'],
        "client_public_key": data['client_public_key']
    }
    cert_json = json.dumps(cert, sort_keys=True)
    signature = simple_sign(cert_json)
    
    # Create signed receipt
    signed_receipt = {
        "cert": cert,
        "bank_sig": signature,
        "bank_public_key": "bank123456789"
    }
    
    # Store receipt in user's transaction history
    store_transaction(username, signed_receipt)
    
    return jsonify(signed_receipt)

@app.route('/api/public_key', methods=['GET'])
def get_public_key():
    """Get a user's public key"""
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Username is required"}), 400
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT public_key FROM users WHERE username = ?", (username,))
    result = cursor.fetchone()
    conn.close()
    
    if not result:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({"username": username, "public_key": result[0]})

# Add this to your imports
import random
import string
import datetime

# Add a dictionary to store challenges
challenges = {}

# Add this endpoint to your app.py
@app.route('/api/get_challenge', methods=['POST'])
def get_challenge():
    data = request.json
    public_key = data.get('public_key')
    
    if not public_key:
        return jsonify({"error": "Public key is required"}), 400
    
    # Generate a random challenge string
    challenge = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    
    # Store the challenge with expiration (5 minutes)
    challenges[challenge] = {
        'created_at': datetime.datetime.now(),
        'expires_at': datetime.datetime.now() + datetime.timedelta(minutes=5),
        'used': False,
        'public_key': public_key
    }
    
    return jsonify({"challenge": challenge})

@app.route('/api/submit_bid_proof', methods=['POST'])
def submit_bid_proof():
    data = request.json
    challenge = data.get('challenge')
    proof_receipt = data.get('proof_receipt')
    item_id = data.get('item_id')
    bid_amount = data.get('bid_amount')
    
    # Check if challenge exists and is valid
    if challenge not in challenges:
        return jsonify({"error": "Invalid challenge"}), 400
        
    challenge_data = challenges[challenge]
    
    # Check if expired
    if datetime.datetime.now() > challenge_data['expires_at']:
        return jsonify({"error": "Challenge expired"}), 400
        
    # Check if already used
    if challenge_data['used']:
        return jsonify({"error": "Challenge already used"}), 400
        
    # Mark challenge as used
    challenge_data['used'] = True
    
    # In a real application, you would verify the RISC0 proof here
    # For now, we'll assume the proof is valid
    
    # Update the auction item with the new bid
    # This is where you would update your auction database
    # ...
    
    return jsonify({
        "message": "Bid placed successfully",
        "item_id": item_id,
        "bid_amount": bid_amount
    })

if __name__ == '__main__':
    print("Bank API starting on http://127.0.0.1:5000")
    print("Database file:", os.path.abspath(DB_PATH))
    app.run(host="127.0.0.1", port=5000, debug=True)