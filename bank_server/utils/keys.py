import os
from cryptography.hazmat.primitives import serialization

from bank_server.app import generate_key_pair

BANK_PRIV_KEY_FILE = 'bank_private_key.pem'
BANK_PUB_KEY_FILE = 'bank_public_key.pem'

def load_or_create_bank_keys():
    """Generate and save bank's key pair if not exists, or load them if already present"""
    if os.path.exists(BANK_PRIV_KEY_FILE):
        # Load existing bank private key
        with open(BANK_PRIV_KEY_FILE, 'rb') as f:
            private_key = serialization.load_pem_private_key(f.read(), password=None)
    else:
        # Generate a new key pair for the bank
        private_key, public_key = generate_key_pair()
        
        # Save the private key
        with open(BANK_PRIV_KEY_FILE, 'wb') as f:
            f.write(private_key)
        
        # Save the public key
        with open(BANK_PUB_KEY_FILE, 'wb') as f:
            f.write(public_key)
    
    # Load the public key (used for verifying the signature)
    with open(BANK_PUB_KEY_FILE, 'rb') as f:
        public_key = f.read()

    return private_key, public_key
