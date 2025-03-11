from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
import base64
import json
from cryptography.hazmat.primitives import serialization

def sign_cert(cert, private_key, public_key):
    """Sign the cert with the bank's private key"""
    
    # Convert the cert dict to JSON bytes (use sorted keys to ensure consistency)
    cert_bytes = json.dumps(cert, sort_keys=True).encode('utf-8')

    # Sign the certificate using the bank's private key
    signature = private_key.sign(cert_bytes, ec.ECDSA(hashes.SHA256()))

    # Serialize the bank's public key to hex
    bank_pub_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    bank_pub_hex = base64.b64encode(bank_pub_bytes).decode('utf-8')

    # Return the signed certificate with the bank's signature
    return {
        "cert": cert,
        "bank_sig": base64.b64encode(signature).decode('utf-8'),
        "bank_public_key": bank_pub_hex
    }
