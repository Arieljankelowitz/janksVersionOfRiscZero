use tauri::command;
use bidding_core::BidDetails;  // Importing BidDetails
use serde::{Serialize, Deserialize};
use serde_json;
use std::error::Error;
use host::run_zkvm;  
use k256::{
    ecdsa::{SigningKey, Signature, signature::Signer},
    sha2::{Sha256, Digest}
};
use hex;

// Struct to hold the fund account details
#[derive(Serialize, Deserialize)]
struct FundAccountDetails {
    balance: f64,
    date: String,
    client_public_key: String,
}

#[command]
fn sign_challenge(challenge: String, private_key: String) -> Result<String, String> {
    // Try to decode the private key from hex
    let private_key_bytes = match hex::decode(&private_key) {
        Ok(bytes) => bytes,
        Err(_) => return Err("Invalid hex string".to_string()),
    };

    // Try to create the signing key
    let signing_key = match SigningKey::from_slice(&private_key_bytes) {
        Ok(key) => key,
        Err(_) => return Err("Couldn't create signing key".to_string()),
    };

    // Try to sign the challenge
    let signature: Signature = signing_key.sign(challenge.as_bytes());
    
    // Convert signature to hex and return the result
    let signature_hex = hex::encode(signature.to_bytes());
    
    Ok(signature_hex)
}


// Define the Tauri command to handle the bid details
#[tauri::command]
fn handle_bid_details(details: BidDetails) -> String {
    match run_zkvm(details) {
        Ok(val) => format!("{}", val),
        Err(e) => {
            // If there's an error, return the error message, no receipt is committed.
            format!("Error: {}", e)
        },
    }
}

#[tauri::command]
fn hash_password(password: String) -> String {
    
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    
    format!("{:x}", result)
}


// The main entry point to run the Tauri app
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![handle_bid_details, sign_challenge, hash_password]) // add functions here
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
 