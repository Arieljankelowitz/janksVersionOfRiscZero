import { invoke } from '@tauri-apps/api/core';

// await invoke('handle_bid_details', { details: bidDetails });

export const signChallenge = async (challenge: string, privateKey: string): Promise<string> => {

    return await invoke('sign_challenge', {challenge, privateKey})
}   