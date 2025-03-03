import './App.css'
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react'
import AuctionPage from './components/auction-page'
import { Button } from './components/ui/button';

// mock data
const date = new Date()

const bankCert = {
  balance: 1000,
  date: "2025-01-30", 
  client_public_key: "04d3a0b0c7207006c2f258e4ed59230a530e6fbecb687bf629d1d074701ad24ab2ca13e7749be39d1a8b3812cdae94520c92c40b0c68445ec103fe99e47f73e2a5"
}

const bankDetails = {
  cert: bankCert,
  bank_sig: "437496313c2182d9b1c37471e2394d9254a753c705b353801c39f0f5a922c4af0a0ac0d8e19041afff9dfeb1c639906d9199329633e49e88c5702b6e4a8883b3",
  bank_public_key: "044e3b81af9c2234cad09d679ce6035ed1392347ce64ce405f5dcd36228a25de6e47fd35c4215d1edf53e6f83de344615ce719bdb0fd878f6ed76f06dd277956de"
}

const bidDetails = {
  bank_details: bankDetails,
  bid: 100,
  challenge: "1111",
  signed_challenge: "f8f8666d654e4e86c51c31b251446431139ca33ae13491bc2f62f8e72e43f0834409a93f75e6b25473a914fb89d3a413297d892ef2d8fa6708b9087ae0ed540f"
}

function App() {
  const [message, setMessage] = useState("")

  const callRust = async () => {
    try {
      // Invoke the Rust function
      const response = await invoke<string>("handle_bid_details", { details: bidDetails });

      // Success: Update message state
      setMessage(response);
    } catch (error) {
      // Handle errors and display to user
      console.error("Rust error:", error);
      setMessage(`Error: ${error}`);
    }
  };

  return (
    <>
      {/* AuctionPage component is rendered here */}
      <AuctionPage />

      {/* Button to invoke Rust function */}
      <Button onClick={callRust}>Place Bid</Button>

      {/* Displaying the response message */}
      <p>{message}</p>
    </>
  );
}

export default App;
