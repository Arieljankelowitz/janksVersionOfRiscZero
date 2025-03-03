from flask import Flask, jsonify, request
from flask_cors import CORS
import hashlib
import json
import sqlite3
import os

app = Flask(__name__)
CORS(app)

# Database file path
DB_PATH = 'bank.db'

def init_db():
    """Initialize the database with users table including public key field"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if the users table already exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    table_exists = cursor.fetchone()
    
    if not table_exists:
        # Create users table with public_key field
        cursor.execute('''
        CREATE TABLE users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            public_key TEXT,
            balance REAL DEFAULT 100
        )
        ''')
        print("Database initialized with users table.")
    else:
        # Check if public_key column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        if 'public_key' not in column_names:
            cursor.execute("ALTER TABLE users ADD COLUMN public_key TEXT")
            print("Added public_key column to existing users table.")
    
    conn.commit()
    conn.close()

# Initialize the database on startup
init_db()

# Helper function to hash passwords
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Bank API is running"})

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    if not all(key in data for key in ['username', 'password']):
        return jsonify({"error": "Missing username or password"}), 400
    
    username = data['username']
    password_hash = hash_password(data['password'])
    
    # Get public key if provided, otherwise set to None
    public_key = data.get('public_key')
    
    # Check if user already exists
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE username = ?", (username,))
    existing_user = cursor.fetchone()
    
    if existing_user:
        conn.close()
        return jsonify({"error": "Username already exists"}), 400
    
    # Add new user
    cursor.execute("INSERT INTO users (username, password_hash, public_key) VALUES (?, ?, ?)", 
                  (username, password_hash, public_key))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "User registered successfully"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not all(key in data for key in ['username', 'password']):
        return jsonify({"error": "Missing username or password"}), 400
    
    username = data['username']
    password_hash = hash_password(data['password'])
    
    # Check credentials
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT username, password_hash, public_key FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or user[1] != password_hash:
        return jsonify({"error": "Invalid username or password"}), 401
    
    # Include public key in response if available
    response = {"message": "Login successful"}
    if user[2]:  # Check if public_key is not None
        response["public_key"] = user[2]
    
    return jsonify(response)

@app.route('/api/update_public_key', methods=['POST'])
def update_public_key():
    data = request.json
    if not all(key in data for key in ['username', 'password', 'public_key']):
        return jsonify({"error": "Missing username, password, or public_key"}), 400
    
    username = data['username']
    password_hash = hash_password(data['password'])
    public_key = data['public_key']
    
    # Verify credentials and update public key
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if user exists and password is correct
    cursor.execute("SELECT username FROM users WHERE username = ? AND password_hash = ?", 
                  (username, password_hash))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return jsonify({"error": "Invalid username or password"}), 401
    
    # Update the public key
    cursor.execute("UPDATE users SET public_key = ? WHERE username = ?", 
                  (public_key, username))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Public key updated successfully"})

@app.route('/api/get_public_key', methods=['GET'])
def get_public_key():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT public_key FROM users WHERE username = ?", (username,))
    result = cursor.fetchone()
    conn.close()
    
    if not result or not result[0]:
        return jsonify({"error": "User not found or public key not set"}), 404
    
    return jsonify({"username": username, "public_key": result[0]})

@app.route('/api/users', methods=['GET'])
def list_users():
    """List all users (for testing only)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT username, public_key FROM users")
    users = [{"username": row[0], "has_public_key": bool(row[1])} for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({"users": users})

if __name__ == '__main__':
    print("Bank API starting on http://127.0.0.1:5000")
    print("Database file:", os.path.abspath(DB_PATH))
    app.run(host="127.0.0.1", port=5000, debug=True)