import React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import { MessageDisplay } from "../ui/message-display"

interface Receipt {
    cert: {
        balance: number
        date: string
        client_public_key: string
    }
    bank_sig: string
    bank_public_key: string
}

interface ProfileViewProps {
    username: string
    userPublicKey: string
    authToken: string
    onNavigateToAuction: () => void
    onLogout: () => void
}

export const ProfileView: React.FC<ProfileViewProps> = ({
    username,
    userPublicKey,
    authToken,
    onNavigateToAuction,
    onLogout,
}) => {
    const [receipts, setReceipts] = useState<Receipt[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [message, setMessage] = useState<string>("")
    const [messageType, setMessageType] = useState<"info" | "success" | "error">("info")

    // Display a message with type and auto-clear
    const displayMessage = (text: string, type: "info" | "success" | "error" = "info") => {
        setMessage(text)
        setMessageType(type)
        setTimeout(() => {
            setMessage("")
        }, 5000) // Clear message after 5 seconds
    }

    // Fetch receipts
    const fetchReceipts = async () => {
        if (!authToken) return

        setIsLoading(true)
        try {
            const response = await axios.get("http://127.0.0.1:5000/api/receipts", {
                headers: { Authorization: authToken },
            })
            setReceipts(response.data.receipts || [])
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                // Token expired or invalid, logout
                onLogout()
                displayMessage("Session expired. Please log in again.", "error")
            } else {
                displayMessage("Failed to fetch receipts", "error")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Format JSON for display
    const formatJson = (json: any): string => {
        try {
            if (typeof json === "string") {
                return JSON.stringify(JSON.parse(json), null, 2)
            }
            return JSON.stringify(json, null, 2)
        } catch (e) {
            return String(json)
        }
    }

    // Load receipts on component mount
    useEffect(() => {
        fetchReceipts()
    }, [authToken])

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-800 text-white p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold">User Profile & Receipts</h1>
                    <div>
                        <button
                            onClick={onNavigateToAuction}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm mr-2"
                        >
                            Back to Auctions
                        </button>
                        <button
                            onClick={onLogout}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {message && <MessageDisplay message={message} type={messageType} className="m-4" />}

            <div className="p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">Account Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-gray-600 text-sm">Username</p>
                            <p className="font-medium">{username}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Public Key</p>
                            <p className="font-mono text-xs truncate">{userPublicKey}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">Your Receipts</h2>
                    {receipts.length > 0 ? (
                        <div className="space-y-4">
                            {receipts.map((receipt, index) => (
                                <div key={index} className="border rounded-md p-4 bg-gray-50">
                                    <h3 className="font-medium text-gray-700 mb-2">Receipt #{index + 1}</h3>
                                    <pre className="bg-white p-3 rounded text-xs overflow-x-auto border">{formatJson(receipt)}</pre>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No receipts available.</p>
                    )}
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={fetchReceipts}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Refresh Receipts"}
                    </button>
                </div>
            </div>
        </div>
    )
}

