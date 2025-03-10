from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import binascii
from init_db import init_db
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization
import binascii

# TODO move to another file to clean code up
def generate_key_pair():
    """Generate a SECP256K1 key pair and return the private and public keys in raw hex format"""
    # Generate a private key using the SECP256K1 curve
    private_key = ec.generate_private_key(ec.SECP256K1())
    
    # Get the public key
    public_key = private_key.public_key()
    
    # Get the raw private key in bytes (32 bytes)
    private_bytes = private_key.private_numbers().private_value.to_bytes(32, byteorder='big')
    
    # Convert to hex
    private_hex = binascii.hexlify(private_bytes).decode('ascii')
    
    # Serialize the public key to bytes and convert to hex
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    public_hex = binascii.hexlify(public_bytes).decode('ascii')
    
    return private_hex, public_hex


app = Flask(__name__)
CORS(app)

# Database file path
DB_PATH = 'bank.db'

# Initialize the database on startup
init_db(DB_PATH)

def create_cert(username):
    # TODO return a cert with balance, date and public key of the user
    pass

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

    cert = create_cert(username)

    # Return the private key for the user to save
    return jsonify({
        "message": "User registered successfully", 
        "cert": cert,
        "private_key": private_key,
    })


@app.route('/api/login', methods=['POST'])
def login():
    # TODO verify username is in db and the password matchs
    return jsonify({"message": "Login successful", "cert": "",})

@app.route('/api/cert/<userId>', methods=['GET'])
def get_cert(userId):
    # TODO generate a cert for the username requesting
    pass

if __name__ == '__main__':
    print("Bank API starting on http://127.0.0.1:5000")
    print("Database file:", os.path.abspath(DB_PATH))
    app.run(host="127.0.0.1", port=5000, debug=True)