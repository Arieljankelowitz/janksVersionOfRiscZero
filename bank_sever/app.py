from flask import Flask, jsonify, request
from flask_cors import CORS
import hashlib
import json
import uuid

app = Flask(__name__)
CORS(app)

users = {}  # Store user data (username -> {password_hash, balance, transactions})
sessions = {}  # Store session tokens (token -> username)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token():
    return str(uuid.uuid4())

def simple_sign(data_str):
    signature = hashlib.sha256(data_str.encode() + b"bank_secret_key").hexdigest()
    return signature

def generate_signed_receipt(username):
    """Generate a signed receipt for a user's balance."""
    user = users.get(username)
    if not user:
        return None
    
    cert = {
        "date": "2024-07-08",  # This should be dynamic in a real app
        "balance": user["balance"],
        "client_public_key": username  # Using username as a placeholder
    }
    
    cert_json = json.dumps(cert, sort_keys=True)
    signature = simple_sign(cert_json)
    
    signed_receipt = {
        "cert": cert,
        "bank_sig": signature,
        "bank_public_key": "bank123456789"
    }
    
    # Store receipt in user's transaction history
    user["transactions"].append(signed_receipt)
    
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
    if username in users:
        return jsonify({"error": "User already exists"}), 400
    
    password_hash = hash_password(data['password'])
    users[username] = {
        "password_hash": password_hash,
        "balance": data['initial_balance'],
        "transactions": []
    }

    # Generate a signed receipt upon signup
    receipt = generate_signed_receipt(username)

    return jsonify({"message": "User registered successfully", "receipt": receipt})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not all(key in data for key in ['username', 'password']):
        return jsonify({"error": "Missing required fields"}), 400
    
    username = data['username']
    user = users.get(username)
    if not user or user['password_hash'] != hash_password(data['password']):
        return jsonify({"error": "Invalid username or password"}), 401
    
    token = generate_token()
    sessions[token] = username
    
    # Generate a signed receipt upon login
    receipt = generate_signed_receipt(username)

    return jsonify({"message": "Login successful", "token": token, "receipt": receipt})

@app.route('/api/receipts', methods=['GET'])
def get_receipts():
    token = request.headers.get("Authorization")
    username = sessions.get(token)
    if not username:
        return jsonify({"error": "Unauthorized"}), 401
    
    return jsonify({"receipts": users[username]['transactions']})

@app.route('/api/sign_bid', methods=['POST'])
def sign_bid():
    token = request.headers.get("Authorization")
    username = sessions.get(token)
    if not username:
        return jsonify({"error": "Unauthorized"}), 401
    
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
    
    # Store transaction in user's history
    signed_receipt = {
        "cert": cert,
        "bank_sig": signature,
        "bank_public_key": "bank123456789"
    }
    
    users[username]['transactions'].append(signed_receipt)
    
    return jsonify(signed_receipt)

if __name__ == '__main__':
    print("Bank API starting on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
