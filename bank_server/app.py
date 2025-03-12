from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime
from ecdsa import SECP256k1, SigningKey
from ecdsa.util import sigencode_der
from init_db import init_db
from ecdsa import SECP256k1, SigningKey
from ecdsa.util import sigencode_string
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
import binascii
import base64
import json


def load_or_create_bank_keys():
    """Load the bank's private and public keys, or generate new ones if they don't exist."""
    bank_private_key_path = 'bank_private_key.pem'
    bank_public_key_path = 'bank_public_key.pem'

    # Check if the bank's private key exists, if not, create it
    if os.path.exists(bank_private_key_path) and os.path.exists(bank_public_key_path):
        with open(bank_private_key_path, 'rb') as f:
            bank_private_key = serialization.load_pem_private_key(f.read(), password=None)

        with open(bank_public_key_path, 'rb') as f:
            bank_public_key = serialization.load_pem_public_key(f.read())
    else:
        # Generate a new key pair if they don't exist
        bank_private_key = ec.generate_private_key(ec.SECP256K1())
        bank_public_key = bank_private_key.public_key()

        # Save the keys to files
        with open(bank_private_key_path, 'wb') as f:
            f.write(bank_private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            ))

        with open(bank_public_key_path, 'wb') as f:
            f.write(bank_public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ))

    return bank_private_key, bank_public_key


def sign_cert(cert, private_key, public_key):
    """Sign the cert with the bank's private key using SECP256k1 (k256) signature in raw 64-byte format"""
    # Convert the cert dict to JSON bytes (sorted keys for consistency)
    cert_bytes = json.dumps(cert, sort_keys=True, ensure_ascii=True, separators=(',', ':')).encode('utf-8')    
    print(cert_bytes)
    # Sign the certificate using SECP256K1 + SHA256
    der_signature = private_key.sign(cert_bytes, ec.ECDSA(hashes.SHA256()))

    # Convert DER-encoded signature to raw 64-byte format (r || s)
    r, s = decode_dss_signature(der_signature)
    raw_signature = r.to_bytes(32, byteorder='big') + s.to_bytes(32, byteorder='big')

    # Serialize the public key in uncompressed format (X9.62)
    bank_pub_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    bank_pub_hex = bank_pub_bytes.hex()

    # Return the signed certificate with the raw 64-byte signature in hex format
    return {
        "cert": cert,
        "bank_sig": raw_signature.hex(),  # Now in raw 64-byte format
        "bank_public_key": bank_pub_hex
    }
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
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT balance, public_key FROM users WHERE username=?", (username,))
    user_data = cursor.fetchone()
    conn.close()

    if not user_data:
        return jsonify({"error": "User not found"}), 404

    # Create the certificate for the user
    balance, client_public_key = user_data

    # Use current date and time in ISO format
    current_date = datetime.utcnow().isoformat() + "Z"

    cert = {
        "balance": balance,
        "client_public_key": client_public_key,
        "date": current_date # Use dynamic current date and time
    }

    # Generate the bank's keys if not done yet (or load from files)
    bank_private_key, bank_public_key = load_or_create_bank_keys()

    # Sign the certificate with the bank's private key
    signed_cert = sign_cert(cert, bank_private_key, bank_public_key)

    # Return the signed certificate
    return jsonify(signed_cert)

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

    # Optionally, generate a certificate for the user (like after login)
   

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

    # Use current date and time in ISO format
    current_date = datetime.utcnow().isoformat() + "Z"

    cert = {
        "balance": int(balance),
        "client_public_key": client_public_key.upper(),
        "date": current_date  # Use dynamic current date and time
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