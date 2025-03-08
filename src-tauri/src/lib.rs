use tauri::command;
use reqwest::Client;
use bidding_core::BidDetails;  // Importing BidDetails

use serde::{Serialize, Deserialize};
use serde_json;
use std::error::Error;
use host::run_zkvm;  // Assuming run_zkvm is your existing function

// Struct to hold the fund account details
#[derive(Serialize, Deserialize)]
struct FundAccountDetails {
    balance: f64,
    date: String,
    client_public_key: String,
}

// Define the Tauri command to handle the fund account
#[command]
async fn handle_fund_account(details: FundAccountDetails) -> Result<serde_json::Value, String> {
  let client = Client::new();
  let url = "http://127.0.0.1:5000/api/sign_bid"; // Flask server URL

  // Make the POST request to the Flask API
  let response = client
      .post(url)
      .json(&details)
      .send()
      .await
      .map_err(|e| e.to_string())?;

  // Check if the request was successful
  if response.status().is_success() {
      // Parse and return the JSON response from the Flask server
      let json_response = response.json::<serde_json::Value>()
          .await
          .map_err(|e| e.to_string())?;
      
      Ok(json_response)
  } else {
      Err("Error funding the account".to_string())
  }
}

// Define the existing Tauri command to handle the bid details
#[tauri::command]
fn handle_bid_details(details: BidDetails) -> String {
    format!("{:?}",details)
    // match run_zkvm(details) {
    //   Ok(val) => format!("Success: {}", val),
    //   Err(e) => format!("Error: {}", e),  
    // }  
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
    .invoke_handler(tauri::generate_handler![handle_bid_details, handle_fund_account]) // Add handle_fund_account here
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
