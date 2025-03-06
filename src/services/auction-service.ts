import axios from "axios"
import { invoke } from "@tauri-apps/api/core"
import type { AuctionItem } from "../types/auction-types"

// Mock auction items - in a real app, these would come from an API
export const MOCK_AUCTION_ITEMS: AuctionItem[] = [
  {
    id: 1,
    title: "Vintage Watch",
    description: "A rare collector's timepiece from the 1950s.",
    image: "https://via.placeholder.com/300x200?text=Vintage+Watch",
    startingBid: 500,
    currentBid: 650,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  },
  {
    id: 2,
    title: "Original Artwork",
    description: "Abstract painting by an emerging contemporary artist.",
    image: "https://via.placeholder.com/300x200?text=Original+Artwork",
    startingBid: 1200,
    currentBid: 1200,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
  },
  {
    id: 3,
    title: "Antique Furniture",
    description: "19th century mahogany desk in excellent condition.",
    image: "https://via.placeholder.com/300x200?text=Antique+Furniture",
    startingBid: 800,
    currentBid: 950,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  },
  {
    id: 4,
    title: "Rare Book Collection",
    description: "First editions of classic literature, set of 5 books.",
    image: "https://via.placeholder.com/300x200?text=Rare+Books",
    startingBid: 350,
    currentBid: 450,
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
  },
]

export const fetchAuctionItems = async (): Promise<AuctionItem[]> => {
  // In a real app, this would fetch from an API
  // For now, return mock data
  return MOCK_AUCTION_ITEMS
}

export const submitBidToServer = async (
  itemId: number,
  bidAmount: number,
  privateKey: string,
  userPublicKey: string,
): Promise<void> => {
  // Step 1: Request a challenge from the server
  const challengeResponse = await axios.post("http://127.0.0.1:5000/api/get_challenge", {
    public_key: userPublicKey,
  })

  const challenge = challengeResponse.data.challenge

  // Step 2: Sign the challenge using the provided private key
  const signedChallenge = await invoke<string>("sign_challenge", {
    challenge: challenge,
    privateKey: privateKey,
  })

  // Step 3: Fetch a signed certificate from the bank API
  // Normally we'd get this from your bank, but for now we'll create a mock one
  const today = new Date().toISOString().split("T")[0]
  const certificate = {
    date: today,
    balance: bidAmount * 2, // Ensure there's enough balance
    client_public_key: userPublicKey,
  }

  // Step 4: Generate RISC0 proof
  const proofReceipt = await invoke<string>("create_bid_proof", {
    cert: JSON.stringify(certificate),
    certSig: "bank-signature-placeholder",
    bankPubKey: "bank-public-key-placeholder",
    privateKey: privateKey,
    challenge: challenge,
    itemId: itemId,
    bidAmount: bidAmount,
  })

  // Step 5: Submit the proof to the server
  await axios.post("http://127.0.0.1:5000/api/submit_bid_proof", {
    proof_receipt: proofReceipt,
    challenge: challenge,
    item_id: itemId,
    bid_amount: bidAmount,
  })
}

