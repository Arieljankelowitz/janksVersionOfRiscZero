use risc0_zkvm::guest::env;
use bidding_core::{Cert, BankDetails, BidDetails, ReceiptOutput};
use k256::{ecdsa::{signature::Verifier, Signature, VerifyingKey}, EncodedPoint,};
use serde_json;

fn main() -> Result<(), Box<dyn Error>> {
    // TODO: Implement your guest code here

    // read the input
    let input: BidDetails  = env::read();

    // check balance is greater than bid
    if input.bank_details.cert.balance < input.bid {
        return Err("Insufficient balance to place bid.".into());
    }


    // Extract banks public key
    let bank_verifying_key = VerifyingKey::from_encoded_point(&input.bank_details.bank_public_key)
        .map_err(|e| "Invalid bank public key.".into())?;     
    // Convert the cert back into a byte array
    let cert_string = serde_json::to_string(&input.bank_details.cert)
        .map_err(|e| "Unable to convert bank details into string".into())?; ;
    let cert_bytes: Vec<u8> = cert_string.into_bytes();
    // Verify the signature of the bank 
    let result = bank_verifying_key
        .verify(&cert_bytes, &input.bank_details.bank_sig)
        .map_err(|e| "Banks sig is not valid".into())?;

    // Verify challenge signature
    let client_verifying_key = VerifyingKey::from_encoded_point(&input.bank_details.cert.client_public_key)
        .map_err(|e| "Invalid client public key.".into())?;  

    let challenge_verification_result = match client_verifying_key
        .verify(&input.challenge.as_bytes(), &input.signed_challenge)
        .map_err(|e| "Client sig is not valid".into())?;

    
    // verify date is today (maybe)

    // output: challenge, date, bid, banks publick key
    let output: ReceiptOutput = {
        challenge: input.challenge.clone(),
        date: input.bank_details.cert.date.clone(),
        bid: input.bid.clone(),
        bank_public_key: input.bank_details.bank_public_key.clone()
    }

    // Write public output to the journal
    env::commit(&output);

    Ok(())
}
