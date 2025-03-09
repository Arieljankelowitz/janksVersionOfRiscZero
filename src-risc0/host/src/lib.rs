use methods::{
    BIDDING_GUEST_ELF, BIDDING_GUEST_ID
};
use risc0_zkvm::{default_prover, ExecutorEnv, ProverOpts, serde::from_slice};
use bidding_core::{BidDetails, ReceiptOutput};
use k256::{
    ecdsa::{SigningKey, Signature, signature::Signer, VerifyingKey}, 
    EncodedPoint
};
use bincode;
use hex;
use std::error::Error;

 
pub fn run_zkvm(details: BidDetails) -> Result<String, Box<dyn Error>> {
    let mut output = Vec::new();
    // For example:
    let input: BidDetails = details;
    let env = ExecutorEnv::builder()
        .write(&input)?
        .stdout(&mut output)
        .build()?;

    // Obtain the default prover.
    let prover = default_prover();
    let prover_opts = ProverOpts::succinct(); // can be changed to composite or groth16(only works on x86)

    // Proof information by proving the specified ELF binary.
    // This struct contains the receipt along with statistics about execution of the guest
    let prove_info = prover
        .prove_with_opts(env, BIDDING_GUEST_ELF, &prover_opts)
        .map_err(|e| {
            let output_slice: String = from_slice(&output).unwrap();
            output_slice
        })?;

    // extract the receipt.
    let receipt = prove_info.receipt;

    // TODO: Implement code for retrieving receipt journal here.

    // let output: ReceiptOutput = receipt.journal.decode().unwrap();
    
    let receipt_bytes = bincode::serialize(&receipt)?;
    let receipt_string = hex::encode(&receipt_bytes);

    Ok(receipt_string)

}
