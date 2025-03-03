use risc0_zkvm::guest::env;
use bidding_core::{Cert, BankDetails, BidDetails};
use k256::{ecdsa::{signature::Verifier, Signature, VerifyingKey}, EncodedPoint,};
use serde_json;

fn main() {
    // TODO: Implement your guest code here

    // read the input
    let input: BidDetails  = env::read();

    // check balance is greater than bid
    if input.bank_details.cert.balance < input.bid {
        env::commit(&"Error: Insufficient balance to place bid.");
        return;
    }


    // verify banks sig on cert
    let verifying_key = VerifyingKey::from_encoded_point(&input.bank_details.bank_public_key).unwrap();

    let cert_string = serde_json::to_string(&input.bank_details.cert).unwrap();
    let cert_bytes: Vec<u8> = cert_string.into_bytes();

    let result = match verifying_key.verify(&cert_bytes, &input.bank_details.bank_sig) {
            Ok(()) => format!("The signature is authentic."),
            Err(e) => format!("The signature is not authentic: {:?}", e),
    };

    // verify signed challenge on challenge
    let challenge = &input.challenge;
    let signed_challenge = &input.signed_challenge; 

    

    let client_verifying_key = VerifyingKey::from_encoded_point(&input.bank_details.cert.client_public_key)
    .expect("Invalid client public key");

let challenge_verification_result = match client_verifying_key.verify(challenge.as_bytes(), signed_challenge) {
    Ok(()) => "The challenge is authentic.".to_string(),
    Err(e) => format!("The challenge is not authentic: {:?}", e),
};

    
    // verify date is today (maybe)

    // output: challenge, date, bid, banks publick key

    let combined_response = format!(
        "{} | {}",
        result, challenge_verification_result,
    );

    // Write public output to the journal
    env::commit(&combined_response);
}
