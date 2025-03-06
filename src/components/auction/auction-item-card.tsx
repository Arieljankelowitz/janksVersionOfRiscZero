import React from "react"
import type { AuctionItem } from "../../types/auction-types"

interface AuctionItemCardProps {
    item: AuctionItem
    onPlaceBid: (item: AuctionItem) => void
    getTimeRemaining: (endTime: string) => string
}

export const AuctionItemCard: React.FC<AuctionItemCardProps> = ({ item, onPlaceBid, getTimeRemaining }) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-48 object-cover" />
            <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-3">{item.description}</p>
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <p className="text-sm text-gray-500">Current Bid</p>
                        <p className="text-lg font-bold">${item.currentBid}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Time Remaining</p>
                        <p className="text-sm font-medium text-orange-600">{getTimeRemaining(item.endTime)}</p>
                    </div>
                </div>
                <button
                    onClick={() => onPlaceBid(item)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-medium"
                >
                    Place Bid
                </button>
            </div>
        </div>
    )
}

