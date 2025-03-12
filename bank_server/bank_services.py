import os
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
import json
from bank_server import sign_cert as rust_sign_cert

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
    """Sign the cert with the bank's private key using Rust implementation"""
    
    # Convert the cert dict to ensure it's JSON serializable
    cert_dict = json.loads(json.dumps(cert))
    
    # Extract the raw private key
    private_bytes = private_key.private_numbers().private_value.to_bytes(32, byteorder='big')
    
    # Serialize the public key in uncompressed format (X9.62)
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    
    # Call the Rust implementation
    result = rust_sign_cert(cert_dict, private_bytes, public_bytes)
    
    return result

def generate_key_pair():
    """Generate a SECP256K1 key pair and return the private and public keys in raw hex format"""
    # Generate a private key using the SECP256K1 curve
    private_key = ec.generate_private_key(ec.SECP256K1())
    
    # Get the public key
    public_key = private_key.public_key()
    
    # Get the raw private key in bytes (32 bytes)
    private_bytes = private_key.private_numbers().private_value.to_bytes(32, byteorder='big')
    
    # Convert to hex
    private_hex = private_bytes.hex()
    
    # Serialize the public key to bytes and convert to hex
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    public_hex = public_bytes.hex()
    
    return private_hex, public_hex