use risc0_zkvm::guest::env;
use bidding_core::{ BidDetails, ReceiptOutput };
use k256::{
    ecdsa::{ signature::Verifier,  VerifyingKey }
};
use serde_json;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    // read the input
    let input: BidDetails  = env::read();

    // check balance is greater than bid
    if input.bank_details.cert.balance < input.bid {
        return Err("Insufficient balance to place bid.".into());
    }

    // Extract banks public key
    let bank_verifying_key = VerifyingKey::from_encoded_point(&input.bank_details.bank_public_key)
        .map_err(|_e| "Invalid bank public key.".to_string())?;  
    // Convert the cert back into a byte array
    let cert_string = serde_json::to_string(&input.bank_details.cert)
        .map_err(|_e| "Unable to convert bank details into string".to_string())?;
    let cert_bytes: Vec<u8> = cert_string.into_bytes();
    // Verify the signature of the bank 
    bank_verifying_key
        .verify(&cert_bytes, &input.bank_details.bank_sig)
        .map_err(|_e| "Banks sig is not valid".to_string())?;

    // Verify challenge signature
    let client_verifying_key = VerifyingKey::from_encoded_point(&input.bank_details.cert.client_public_key)
        .map_err(|_e| "Invalid client public key.".to_string())?;  

    client_verifying_key
        .verify(&input.challenge.as_bytes(), &input.signed_challenge)
        .map_err(|_e| "Client sig is not valid".to_string())?;

    
    // verify date is today (maybe)

    // output: challenge, date, bid, banks publick key
    let output = ReceiptOutput {
        challenge: input.challenge.clone(),
        date: input.bank_details.cert.date.clone(),
        bid: input.bid.clone(),
        bank_public_key: input.bank_details.bank_public_key.clone()
    };

    // Write public output to the journal
    env::commit(&output);

    Ok(())
}
