// src/lib.rs
use pyo3::prelude::*;
use pyo3::types::{PyBytes, PyDict, PyList};
use pyo3::exceptions::PyValueError;

use k256::{
    ecdsa::{signature::Signer, Signature, SigningKey},
    PublicKey,
};
use k256::elliptic_curve::sec1::ToEncodedPoint;
use serde_json::Value;
use std::collections::BTreeMap;

// Function to convert PyAny to serde_json::Value
fn pyany_to_json(value: &PyAny) -> PyResult<Value> {
    if value.is_none() {
        return Ok(Value::Null);
    } else if let Ok(val) = value.extract::<bool>() {
        return Ok(Value::Bool(val));
    } else if let Ok(val) = value.extract::<i64>() {
        return Ok(Value::Number(val.into()));
    } else if let Ok(val) = value.extract::<f64>() {
        return Ok(match serde_json::Number::from_f64(val) {
            Some(n) => Value::Number(n),
            None => return Err(PyValueError::new_err("Cannot convert f64 to JSON number")),
        });
    } else if let Ok(val) = value.extract::<String>() {
        return Ok(Value::String(val));
    } else if let Ok(list) = value.downcast::<PyList>() {
        let mut json_list = Vec::new();
        for item in list.iter() {
            json_list.push(pyany_to_json(item)?);
        }
        return Ok(Value::Array(json_list));
    } else if let Ok(dict) = value.downcast::<PyDict>() {
        let mut map = serde_json::Map::new();
        for (key, val) in dict.iter() {
            let key_str = key.extract::<String>()?;
            map.insert(key_str, pyany_to_json(val)?);
        }
        return Ok(Value::Object(map));
    }

    Err(PyValueError::new_err(format!("Unsupported Python type: {}", value.get_type().name()?)))
}

#[pyfunction]
fn sign_cert(py: Python, cert: &PyDict, private_key_bytes: &PyBytes, public_key_bytes: &PyBytes) -> PyResult<PyObject> {
    // Convert cert PyDict to a sorted JSON-serializable format
    let mut cert_map = BTreeMap::new();
    for (key, value) in cert.iter() {
        let key_str = key.extract::<String>()?;
        
        // Convert PyAny to JSON Value
        let py_value = match pyany_to_json(value) {
            Ok(v) => v,
            Err(e) => return Err(e),
        };
        
        cert_map.insert(key_str, py_value);
    }
    
    // Serialize with sorted keys
    let cert_json = match serde_json::to_string(&cert_map) {
        Ok(json) => json,
        Err(e) => return Err(PyValueError::new_err(format!("JSON serialization error: {}", e))),
    };
    
    let cert_bytes = cert_json.as_bytes();
    
    // Debugging: print cert bytes
    println!("Cert bytes: {:?}", String::from_utf8_lossy(cert_bytes));
    
    // Parse the private key
    let private_key_slice = private_key_bytes.as_bytes();
    let signing_key = match SigningKey::from_bytes(private_key_slice.into()) {
        Ok(key) => key,
        Err(e) => return Err(PyValueError::new_err(format!("Invalid private key: {}", e))),
    };
    
    // Parse the public key
    let public_key_slice = public_key_bytes.as_bytes();
    let public_key = match PublicKey::from_sec1_bytes(public_key_slice) {
        Ok(key) => key,
        Err(e) => return Err(PyValueError::new_err(format!("Invalid public key: {}", e))),
    };
    
    // Sign the certificate
    let signature: Signature = signing_key.sign(cert_bytes);
    
    // Get the r and s components as bytes
    let r_bytes = signature.r().to_bytes();
    let s_bytes = signature.s().to_bytes();
    
    // Concatenate r and s into a 64-byte signature
    let mut raw_signature = Vec::with_capacity(64);
    raw_signature.extend_from_slice(&r_bytes);
    raw_signature.extend_from_slice(&s_bytes);
    
    // Convert the public key to uncompressed format - FIX: Create a binding for the temporary value
    let encoded_point = public_key.to_encoded_point(false);
    let bank_pub_bytes = encoded_point.as_bytes();
    
    // Create the result dictionary
    let result = PyDict::new(py);
    result.set_item("cert", cert)?;
    result.set_item("bank_sig", hex::encode(&raw_signature))?;
    result.set_item("bank_public_key", hex::encode(bank_pub_bytes))?;
    
    Ok(result.into())
}

#[pymodule]
fn bank_server(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(sign_cert, m)?)?;
    Ok(())
}