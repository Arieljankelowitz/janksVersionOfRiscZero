use serde::{Deserialize, Serialize};
use k256::{
    ecdsa::{Signature}, 
    EncodedPoint
};


#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Cert {
    pub balance: u32,
    pub date: String, // Keep as String maybe change later prob not
    pub client_public_key: EncodedPoint,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct BankDetails {
    pub cert: Cert,
    pub bank_sig: Signature,
    pub bank_public_key: EncodedPoint,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct BidDetails {
    pub bank_details: BankDetails,
    pub bid: u32,
    pub challenge: String,
    pub signed_challenge: Signature,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ReceiptOutput {
    pub bid: u32,
    pub challenge: String,
    pub date: String, // Keep as String maybe change later prob not
    pub bank_public_key: EncodedPoint,
}
