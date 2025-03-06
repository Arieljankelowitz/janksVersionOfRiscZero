import React from "react"
import { useState } from "react"
import type { AuctionItem } from "../../types/auction-types"

interface BidModalProps {
    item: AuctionItem
    onClose: () => void
    onSubmitBid: (bidAmount: number, privateKey: string) => Promise<void>
    isProcessing: boolean
    formatDate: (dateString: string) => string
}

export const BidModal: React.FC<BidModalProps> = ({ item, onClose, onSubmitBid, isProcessing, formatDate }) => {
    const [bidAmount, setBidAmount] = useState<number>(item.currentBid + 10)
    const [privateKey, setPrivateKey] = useState<string>("")
    const [bidError, setBidError] = useState<string>("")

    const handleSubmit = async () => {
        // Validate inputs
        if (!privateKey) {
            setBidError("Please enter your private key")
            return
        }

        if (bidAmount <= item.currentBid) {
            setBidError("Your bid must be higher than the current bid")
            return
        }

        try {
            await onSubmitBid(bidAmount, privateKey)
        } catch (error) {
            setBidError(`Error: ${error}`)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Place a Bid on {item.title}</h3>

                <div className="mb-4">
                    <p className="text-gray-600 mb-2">Current Bid: ${item.currentBid}</p>
                    <p className="text-gray-600 mb-4">Auction Ends: {formatDate(item.endTime)}</p>

                    {/* Bid amount input */}
                    <label className="block text-gray-700 font-medium mb-2">Your Bid Amount</label>
                    <input
                        type="number"
                        min={item.currentBid + 1}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        className="border border-gray-300 rounded w-full p-2 mb-4"
                    />

                    {/* Private key input */}
                    <label className="block text-gray-700 font-medium mb-2">Your Private Key</label>
                    <textarea
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        className="border border-gray-300 rounded w-full p-2 mb-4 font-mono text-sm"
                        rows={3}
                        placeholder="Paste your private key here..."
                    />

                    <p className="text-sm text-gray-500 mb-4">
                        Enter your private key to sign this bid. Your key is never stored or sent to our servers.
                    </p>

                    {/* Error message */}
                    {bidError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{bidError}</div>
                    )}
                </div>

                <div className="flex justify-between">
                    <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isProcessing || bidAmount <= item.currentBid || !privateKey}
                        className={`bg-green-600 ${isProcessing || bidAmount <= item.currentBid || !privateKey
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-green-700"
                            } text-white font-bold py-2 px-4 rounded`}
                    >
                        {isProcessing ? "Processing..." : "Confirm Bid"}
                    </button>
                </div>
            </div>
        </div>
    )
}

