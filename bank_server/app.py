from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from init_db import init_db
from bank_services import generate_key_pair, load_or_create_bank_keys, sign_cert

app = Flask(__name__)
CORS(app)

# Database file path
DB_PATH = 'bank.db'

# Initialize the database on startup
init_db(DB_PATH)

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Bank API is running"})

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    balance = data.get('balance')

    # Generate key pair
    private_key, public_key = generate_key_pair()

    # Insert user into the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO users (username, password, public_key, balance)
        VALUES (?, ?, ?, ?)
    ''', (username, password, public_key, balance))
    
    conn.commit()
    conn.close()

    # Return the private key for the user to save
    return jsonify({
        "message": "User registered successfully", 
        "private_key": private_key,
        "username": username
    })


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Fetch the user data from the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT password, public_key, balance FROM users WHERE username=?", (username,))
    user_data = cursor.fetchone()
    conn.close()

    if not user_data:
        return jsonify({"error": "Invalid username or password"}), 404

    stored_password, public_key, balance = user_data

    # Check if the provided password matches the stored password
    if password != stored_password:
        return jsonify({"error": "Invalid username or password"}), 401

    return jsonify({
        "message": "Login successful",
        "username": username
    })


@app.route('/api/cert/<userId>', methods=['GET'])
def get_cert(userId):
    """Generate and return a certificate signed by the bank"""
    
    # Fetch the user data from the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT balance, public_key FROM users WHERE username=?", (userId,))
    user_data = cursor.fetchone()
    conn.close()

    if not user_data:
        return jsonify({"error": "User not found"}), 404

    # Create the certificate for the user
    balance, client_public_key = user_data


    cert = {
        "balance": int(balance),
        "client_public_key": client_public_key.upper(),
    }

    # Generate the bank's keys if not done yet (or load from files)
    bank_private_key, bank_public_key = load_or_create_bank_keys()

    # Sign the certificate with the bank's private key
    signed_cert = sign_cert(cert, bank_private_key, bank_public_key)

    # Return the signed certificate
    return jsonify(signed_cert)


if __name__ == '__main__':
    print("Bank API starting on http://127.0.0.1:5000")
    print("Database file:", os.path.abspath(DB_PATH))
    app.run(host="127.0.0.1", port=5000, debug=True)