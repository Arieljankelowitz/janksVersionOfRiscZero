import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

function ConnectionTest() {
    const [receipt, setReceipt] = useState("");
    const [error, setError] = useState("");  // To show errors

    const privateKey = "4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318";
    const publicKey = "044e3b81af9c2234cad09d679ce6035ed1392347ce64ce405f5dcd36228a25de6e47fd35c4215d1edf53e6f83de344615ce719bdb0fd878f6ed76f06dd277956de";
    const bank_public_key = publicKey;  // Corrected to use the public key defined earlier
    const bank_sig_hex = "437496313c2182d9b1c37471e2394d9254a753c705b353801c39f0f5a922c4af0a0ac0d8e19041afff9dfeb1c639906d9199329633e49e88c5702b6e4a8883b3";
    const signed_challenge_hex = "BD13AC123219902DAC8154CF560A4DF5F990242EC040BC34E60FB5C96B1E776A72159ED282BD9B1B8F609DC58E8AD2E90352240FF53A9FBC448D22D67086B157";

    const bidDetails = {
        bank_details: {
            cert: {
                balance: 100,
                date: "today",
                client_public_key: publicKey
            },
            bank_sig: bank_sig_hex,
            bank_public_key,
        },
        bid: 1000,
        challenge: "sign me",
        signed_challenge: signed_challenge_hex
    };

    const submitBid = async () => {
        try {
            // Call the Rust function to handle the bid details
            const bidReceipt = await invoke('handle_bid_details', { details: bidDetails });

            // Type assertion: we know the result is a string
            setReceipt(bidReceipt as string); // Assert bidReceipt as a string
            setError(""); // Reset error if the request is successful
        } catch (err) {
            // Handle any errors that occur during the invoke call
            setError(`Error: ${err}`);
            setReceipt(""); // Reset receipt if an error occurs
        }
    };

    return (
        <div>
            <button onClick={submitBid}>Submit Bid</button>

            {/* Show the receipt */}
            {receipt && <p>Receipt: {receipt}</p>}

            {/* Show error message */}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default ConnectionTest;
