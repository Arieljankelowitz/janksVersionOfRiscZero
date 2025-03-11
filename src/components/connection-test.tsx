import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

function ConnectionTest() {
    const [receipt, setReceipt] = useState("");
    const [error, setError] = useState("");  // To show errors

    const clientKey = "04377573c25ec4dd83cc006827f5ff9c4b2eca01db5189ad9cae8e9b90d49e953ea0ddfab13201e7729b4faadd1c3dd6cc0ef7f10b702fab632b157b98d098f159";
    const publicKey = "04b2566f5e2e052591b0f82be9f5fdb87f976340e7217b629949141062fc9a05ea15a7b43d0ed7669b1a2004074bb85c7c3394a9a95f5c26a0e662346bca4ee3d8";
    const bank_public_key = publicKey;  // Corrected to use the public key defined earlier
    const bank_sig_hex = "34fc93e8089bc84a3e2f11cb6cb9983541622502b51562be412e9b7974846555cb9b2dbc816e3525ad9768aee7e617c368e972d92ecd633d5f74ceb2cdaec408";
    const signed_challenge_hex = "BD13AC123219902DAC8154CF560A4DF5F990242EC040BC34E60FB5C96B1E776A72159ED282BD9B1B8F609DC58E8AD2E90352240FF53A9FBC448D22D67086B157";
    const date = "2025-03-11T22:18:51.954595Z"

    const bidDetails = {
        bank_details: {
            cert: {
                balance: 200,
                client_public_key: clientKey,
                date,
            },
            bank_sig: bank_sig_hex,
            bank_public_key,
        },
        bid: 10,
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
