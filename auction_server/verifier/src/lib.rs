use pyo3::prelude::*;
use pyo3::exceptions::PyRuntimeError;
use serde::{Serialize, Deserialize};
use serde_json;
use std::fs::File;
use std::io::Write;
use std::io::BufReader;
use bincode;
use risc0_zkvm::Receipt;
use rusqlite::{params, Connection, Result};

#[derive(Serialize, Deserialize, Debug)]
struct Data {
    guest_id: [u32; 8],
}

fn read_id_file() -> Result<[u32; 8], Box<dyn std::error::Error>> {
    // Try to open the file
    let file = File::open("path to file with ID.json")?;
    let reader = BufReader::new(file);

    // Try to deserialize the content
    let data: Data = serde_json::from_reader(reader)?;

    // Return the guest_id, no need to return Data struct
    Ok(data.guest_id)
}


fn challenge_exists(db_path: &str, challenge: &str) -> Result<bool, rusqlite::Error> {
    let conn = Connection::open(db_path)?;

    let mut stmt = conn.prepare("SELECT EXISTS(SELECT 1 FROM challenges WHERE challenge = ?)")?;
    let exists: bool = stmt.query_row(params![challenge], |row| row.get(0))?;

    Ok(exists)
}


// #[pyfunction]
// fn verify_receipt(reciept: Vec<u8>) -> PyResult<String> {
//     let guest_id = read_id_file()?;
//     let receipt: Receipt = bincode::deserialize(&receipt_bytes).unwrap();

//     receipt
//         .verify(guest_id)
//         .unwrap();
    
//     let output: String = receipt.journal.decode().unwrap();
    
//     let is_valid_challenge = challenge_exists("auction.db", output.challenge)?;
// }

/// Formats the sum of two numbers as string.
#[pyfunction]
fn sum_as_string(a: String) -> PyResult<bool> {
    let exists = challenge_exists("auction.db", &a)
        .map_err(|e| PyRuntimeError::new_err(format!("Database error: {}", e)))?;
    
    Ok(exists)
}

/// A Python module implemented in Rust.
#[pymodule]
fn verifier(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(sum_as_string, m)?)?;
    Ok(())
}
