// Install required packages:
// npm install socket.io-client @types/socket.io-client

import { fetchAuction } from '@/services/auction-services';
import { AuctionItem } from '@/types/auction-types';
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// Define types for our data

interface BidUpdate {
    auction_id: string;
    new_bid: number;
}

interface ErrorMessage {
    message: string;
}

interface AuctionDetailProps {
    auctionId: string;
}

const AuctionDetail: React.FC<AuctionDetailProps> = ({ auctionId }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState<boolean>(false);
    const [currentBid, setCurrentBid] = useState<number>(0);
    const [error, setError] = useState<string>('');
    const [receipt, setReceipt] = useState<string>('');
    const [auctionData, setAuctionData] = useState<AuctionItem | null>(null);

    // Initialize socket connection
    useEffect(() => {
        // Create socket connection
        const newSocket: Socket = io('http://127.0.0.1:5001');

        // Set up event handlers
        newSocket.on('connect', () => {
            console.log('Connected to WebSocket server');
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
            setConnected(false);
        });

        // Listen for bid updates
        newSocket.on('bid_update', (data: BidUpdate) => {
            if (data.auction_id === auctionId) {
                console.log(`New bid received: $${data.new_bid}`);
                setCurrentBid(data.new_bid);
            }
        });

        // Listen for error messages
        newSocket.on('error', (data: ErrorMessage) => {
            setError(data.message);
            setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
        });

        // Store socket in state
        setSocket(newSocket);

        // Cleanup on component unmount
        return () => {
            newSocket.disconnect();
        };
    }, [auctionId]);

    // Initial data fetch for the auction
    useEffect(() => {
        const fetchAuctionDetails = async (): Promise<void> => {
            try {
                const auctionData = await fetchAuction(auctionId);

                setAuctionData(auctionData);
                setCurrentBid(auctionData?.bid || 0);
            } catch (error) {
                console.error('Error fetching auction details:', error);
                setError('Failed to load auction details');
            }
        };

        fetchAuctionDetails();
    }, [auctionId]);

    // Function to place a bid
    const placeBid = (): void => {
        if (!socket || !connected) {
            setError('Socket not connected');
            return;
        }

        if (!receipt.trim()) {
            setError('Receipt cannot be empty');
            return;
        }

        try {
            socket.emit('place_bid', {
                auction_id: auctionId,
                receipt: receipt
            });

            // Clear receipt field after submission
            setReceipt('');
        } catch (error) {
            console.error('Error placing bid:', error);
            setError('Failed to place bid');
        }
    };

    return (
        <div className="auction-container">
            <h2>{auctionData?.title || `Auction #${auctionId}`}</h2>

            <div className="connection-status">
                Status: {connected ? 'Connected' : 'Disconnected'}
            </div>

            <div className="current-bid">
                Current Bid: ${currentBid.toLocaleString()}
            </div>

            {auctionData?.description && (
                <div className="auction-description">
                    {auctionData.description}
                </div>
            )}

            <div className="bid-form">
                <input
                    type="text"
                    value={receipt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReceipt(e.target.value)}
                    placeholder="Enter bid receipt"
                />
                <button
                    onClick={placeBid}
                    disabled={!connected || !receipt.trim()}
                >
                    Place Bid
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
        </div>
    );
};


export default AuctionDetail;