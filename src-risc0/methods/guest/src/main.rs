use risc0_zkvm::guest::env;
use bidding_core::{ BidDetails, ReceiptOutput };
use k256::{
    ecdsa::{ signature::Verifier,  VerifyingKey }
};
use serde_json;

fn main() {
    // read the input
    let input: BidDetails  = env::read();
    

    // check balance is greater than bid
    if input.bank_details.cert.balance < input.bid {
        env::write(&"Insufficient balance to place bid.".to_string());
        env::exit(1);
    }

    // Extract banks public key
    let bank_verifying_key = match VerifyingKey::from_encoded_point(&input.bank_details.bank_public_key) {
        Ok(key) => key,
        Err(_) => {
            env::write(&"Invalid bank public key.".to_string());
            env::exit(1);
        }
    };
     
    // Convert the cert back into a byte array
    let cert_string = match serde_json::to_string(&input.bank_details.cert) {
        Ok(string) => string,
        Err(_) => {
            env::write(&"Unable to convert bank details into string".to_string());
            env::exit(1);
        }
    };

    let cert_bytes: Vec<u8> = cert_string.into_bytes();

    // Verify the signature of the bank 
    match bank_verifying_key
        .verify(&cert_bytes, &input.bank_details.bank_sig) {
            Ok(_) => {},
            Err(e) => {
                let error_message = format!("Bank signature verification failed: {}", e);
                env::write(&error_message);
                env::exit(1);
            }
        };

    // Verify challenge signature
    let client_verifying_key = match VerifyingKey::from_encoded_point(&input.bank_details.cert.client_public_key) {
        Ok(key) => key,
        Err(_) => {
            env::write(&"Invalid client public key.".to_string());
            env::exit(1);
        }
    };

    match client_verifying_key
    .verify(&input.challenge.as_bytes(), &input.signed_challenge) {
        Ok(_) => {},
        Err(_) => {
            env::write(&"Client signature is not valid.".to_string());
            env::exit(1);
        }
    };

    
    // verify date is today (maybe)

    // output: challenge, date, bid, banks public key
    let output = ReceiptOutput {
        challenge: input.challenge.clone(),
        date: input.bank_details.cert.date.clone(),
        bid: input.bid.clone(),
        bank_public_key: input.bank_details.bank_public_key.clone()
    };

    // Write public output to the journal
    env::commit(&output);

}
