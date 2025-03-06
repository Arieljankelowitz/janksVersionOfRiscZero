import React from "react"

interface AuctionHeaderProps {
    username: string
    onViewMyBids: () => void
    onLogout: () => void
}

export const AuctionHeader: React.FC<AuctionHeaderProps> = ({ username, onViewMyBids, onLogout }) => {
    return (
        <header className="bg-gray-800 text-white p-4 shadow-md">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold">Anonymous Auction</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-sm">Welcome, {username}</span>
                    <button onClick={onViewMyBids} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        My Bids
                    </button>
                    <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                        Logout
                    </button>
                </div>
            </div>
        </header>
    )
}

