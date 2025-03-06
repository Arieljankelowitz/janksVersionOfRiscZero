import React from "react"
import { useState, useEffect } from "react"
import { AuctionHeader } from "../components/auction/auction-header"
import { AuctionItemCard } from "../components/auction/auction-item-card"
import { BidModal } from "../components/auction/bid-modal"
import { MessageDisplay } from "../components/ui/message-display"
import type { AuctionItem } from "../types/auction-types"
import { fetchAuctionItems, submitBidToServer } from "../services/auction-service"
import { formatDate, getTimeRemaining } from "../utils/data-utils"

interface AuctionItemsPageProps {
    username: string
    authToken: string
    onLogout: () => void
    userPublicKey: string
    navigateTo: (page: string) => void
}

const AuctionItemsPage: React.FC<AuctionItemsPageProps> = ({
    username,
    authToken,
    onLogout,
    userPublicKey,
    navigateTo,
}) => {
    const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([])
    const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null)
    const [message, setMessage] = useState<string>("")
    const [messageType, setMessageType] = useState<"info" | "success" | "error">("info")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isProcessing, setIsProcessing] = useState<boolean>(false)

    // Fetch auction items
    useEffect(() => {
        const loadAuctionItems = async () => {
            setIsLoading(true)
            try {
                const items = await fetchAuctionItems()
                setAuctionItems(items)
            } catch (error) {
                displayMessage("Failed to load auction items", "error")
            } finally {
                setIsLoading(false)
            }
        }

        loadAuctionItems()
    }, [])

    // Display a message with type and auto-clear
    const displayMessage = (text: string, type: "info" | "success" | "error" = "info") => {
        setMessage(text)
        setMessageType(type)
        setTimeout(() => {
            setMessage("")
        }, 5000)
    }

    // Open the bid modal for an item
    const openBidModal = (item: AuctionItem) => {
        setSelectedItem(item)
    }

    // Close the bid modal
    const closeBidModal = () => {
        setSelectedItem(null)
    }

    // Submit a bid for an auction item
    const submitBid = async (bidAmount: number, privateKey: string) => {
        if (!selectedItem) return

        setIsProcessing(true)
        try {
            await submitBidToServer(selectedItem.id, bidAmount, privateKey, userPublicKey)

            // Update the auction item with the new bid
            setAuctionItems((items) =>
                items.map((item) => (item.id === selectedItem.id ? { ...item, currentBid: bidAmount } : item)),
            )

            displayMessage(`Bid of $${bidAmount} placed successfully!`, "success")
            closeBidModal()
        } catch (error) {
            throw error
        } finally {
            setIsProcessing(false)
        }
    }

    // View my bids (redirects to user profile/receipts page)
    const viewMyBids = () => {
        navigateTo("profile")
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <AuctionHeader username={username} onViewMyBids={viewMyBids} onLogout={onLogout} />

            {/* Main Content */}
            <main className="max-w-6xl mx-auto p-6">
                {/* Message display */}
                {message && <MessageDisplay message={message} type={messageType} className="mb-6" />}

                <h2 className="text-2xl font-bold mb-6">Current Auctions</h2>

                {isLoading ? (
                    <div className="text-center py-10">
                        <p>Loading auction items...</p>
                    </div>
                ) : (
                    /* Auction Items Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {auctionItems.map((item) => (
                            <AuctionItemCard
                                key={item.id}
                                item={item}
                                onPlaceBid={openBidModal}
                                getTimeRemaining={getTimeRemaining}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Bid Modal */}
            {selectedItem && (
                <BidModal
                    item={selectedItem}
                    onClose={closeBidModal}
                    onSubmitBid={submitBid}
                    isProcessing={isProcessing}
                    formatDate={formatDate}
                />
            )}
        </div>
    )
}

export default AuctionItemsPage

