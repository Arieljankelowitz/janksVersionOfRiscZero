import sqlite3
import random
import string

def create_challenge(DB_PATH):
    """Get all auctions"""
    challenge_string = ''.join(random.choices(string.ascii_letters + string.digits, k=32))

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO challenges (challenge)
        VALUES (?)
    ''', (challenge_string,))
    
    conn.commit()
    conn.close()

    
    return challenge_string


