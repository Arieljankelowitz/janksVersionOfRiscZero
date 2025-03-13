use methods::{
    BIDDING_GUEST_ELF,BIDDING_GUEST_ID
};
use risc0_zkvm::{default_prover, ExecutorEnv, ProverOpts, serde::from_slice};
use bidding_core::{BidDetails};
use bincode;
use hex;
use std::error::Error;

 
pub fn run_zkvm(details: BidDetails) -> Result<String, Box<dyn Error>> {
    let mut output = Vec::new();
    let input: BidDetails = details;

    println!("{:?}", BIDDING_GUEST_ID);

    let env = ExecutorEnv::builder()
        .write(&input)?
        .stdout(&mut output)
        .build()?;

    // Obtain the default prover.
    let prover = default_prover();
    let prover_opts = ProverOpts::succinct(); // can be changed to composite or groth16(only works on x86)

    // Proof information by proving the specified ELF binary.
    let prove_info = prover
        .prove_with_opts(env, BIDDING_GUEST_ELF, &prover_opts)
        .map_err(|_e| {
            let output_slice: String = from_slice(&output).unwrap();
            output_slice
        })?;

    // extract the receipt.
    let receipt = prove_info.receipt;

    // turn the string into a string to send to user
    let receipt_bytes = bincode::serialize(&receipt)?;
    let receipt_string = hex::encode(&receipt_bytes);

    Ok(receipt_string)

}
