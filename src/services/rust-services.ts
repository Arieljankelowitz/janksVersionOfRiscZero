import { invoke } from '@tauri-apps/api/core';

// await invoke('handle_bid_details', { details: bidDetails });

export const signChallenge = async (challenge: string, privateKey: string): Promise<string> => {
    try {
        return await invoke('sign_challenge', { challenge, privateKey });
    } catch (error) {
        throw new Error("Failed to sign challenge");
    }
};


export const submitBid = async (bidDetails: any) => {
    try {
        // Call the Rust function to handle the bid details
        const bidReceipt = await invoke('handle_bid_details', { details: bidDetails });
        
        return bidReceipt

    } catch (err) {
        throw new Error(`Failed to run ZKVM: ${err}`);
    }
};


export const hashPassword = async (password: string) => {
    try {
        const hashedPassword = await invoke('hash_password', {password})

        return hashedPassword
    } catch (err) {
        throw new Error(`Failed to run hash password: ${err}`);
    }
}