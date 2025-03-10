use tauri::command;
use bidding_core::BidDetails;  // Importing BidDetails
use serde::{Serialize, Deserialize};
use serde_json;
use std::error::Error;
use host::run_zkvm;  
use k256::{
    ecdsa::{SigningKey, Signature, signature::Signer}
};
use hex;

// Struct to hold the fund account details
#[derive(Serialize, Deserialize)]
struct FundAccountDetails {
    balance: f64,
    date: String,
    client_public_key: String,
}

// Define the Tauri command to handle the fund account
#[command]
fn sign_challenge(challenge: String, private_key: String) -> String {
    let private_key_bytes = hex::decode(private_key).expect("Invalid hex string");
    let signing_key = SigningKey::from_slice(&private_key_bytes).expect("couldn't create signing key");

    let signature: Signature = signing_key.sign(challenge.as_bytes());
    let signature_hex = hex::encode(signature.to_bytes());

    return signature_hex
}

// Define the Tauri command to handle the bid details
#[tauri::command]
fn handle_bid_details(details: BidDetails) -> String {
    match run_zkvm(details) {
        Ok(val) => format!("Success: {}", val),
        Err(e) => {
            // If there's an error, return the error message, no receipt is committed.
            format!("Error: {}", e)
        },
    }
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
        .invoke_handler(tauri::generate_handler![handle_bid_details, sign_challenge]) // add functions here
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
 