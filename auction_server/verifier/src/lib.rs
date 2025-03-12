use pyo3::prelude::*;
use pyo3::exceptions::PyRuntimeError;
use serde::{Serialize, Deserialize};
use serde_json;
use std::fs::File;
use std::io::BufReader;
use bincode;
use risc0_zkvm::Receipt;
use rusqlite::{params, Connection, Result};
use k256::EncodedPoint;

#[derive(Serialize, Deserialize, Debug)]
struct Data {
    guest_id: [u32; 8],
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ReceiptOutput {
    pub bid: u32,
    pub challenge: String,
    pub bank_public_key: EncodedPoint,
}

fn read_id_file() -> Result<[u32; 8], Box<dyn std::error::Error>> {
    // Try to open the file
    let file = File::open("guest_id.json")?;
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


#[pyfunction]
fn verify_receipt(receipt_string: String) -> PyResult<u32> {
    let guest_id = read_id_file()
        .map_err(|e| PyRuntimeError::new_err(format!("IO error: {}", e)))?;    

    // Parse Receipt
    let receipt_bytes = hex::decode(&receipt_string)
        .map_err(|e| PyRuntimeError::new_err(format!("Hex decode error: {}", e)))?;

    let receipt: Receipt = bincode::deserialize(&receipt_bytes)
        .map_err(|e| PyRuntimeError::new_err(format!("Deserialize error: {}", e)))?;
    
    // Verify Receipt
    receipt
        .verify(guest_id)
        .map_err(|e| PyRuntimeError::new_err(format!("Verify error: {}", e)))?;

    let output: ReceiptOutput = receipt.journal.decode()
        .map_err(|e| PyRuntimeError::new_err(format!("Decode error: {}", e)))?;

    let challenge: String = output.challenge;

    let exists = challenge_exists("auction.db", &challenge)
        .map_err(|e| PyRuntimeError::new_err(format!("Database error: {}", e)))?;
    
    
    if exists {
        let bid: u32 = output.bid;

        Ok(bid)
    } else {
        Err(PyRuntimeError::new_err("Challenge does not exist"))
    }
    
}




/// A Python module implemented in Rust.
#[pymodule]
fn verifier(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(verify_receipt, m)?)?;
    Ok(())
}
