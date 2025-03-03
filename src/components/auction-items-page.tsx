import React, { useState, useEffect } from "react";
import axios from "axios";
import { invoke } from '@tauri-apps/api/core';

// Mock auction items - in a real app, these would come from an API
const MOCK_AUCTION_ITEMS = [
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
  }
];

interface AuctionItem {
  id: number;
  title: string;
  description: string;
  image: string;
  startingBid: number;
  currentBid: number;
  endTime: string;
}

interface AuctionItemsPageProps {
  username: string;
  authToken: string;
  onLogout: () => void;
  userPublicKey: string;
  navigateTo: (page: string) => void;
}

const AuctionItemsPage: React.FC<AuctionItemsPageProps> = ({ 
  username, 
  authToken, 
  onLogout,
  userPublicKey,
  navigateTo
}) => {
  const [auctionItems, setAuctionItems] = useState<AuctionItem[]>(MOCK_AUCTION_ITEMS);
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [bidError, setBidError] = useState<string>('');
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Fetch auction items (in a real app, this would come from an API)
  useEffect(() => {
    // For now, we're using mock data
    // In a real implementation, you'd call your API here
    setAuctionItems(MOCK_AUCTION_ITEMS);
  }, []);

  // Format a date string to a more readable format
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate time remaining until auction end
  const getTimeRemaining = (endTime: string): string => {
    const total = new Date(endTime).getTime() - Date.now();
    if (total <= 0) return "Auction ended";
    
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  // Display a message with type and auto-clear
  const displayMessage = (text: string, type: "info" | "success" | "error" = "info") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
    }, 5000);
  };

  // Open the bid modal for an item
  const openBidModal = (item: AuctionItem) => {
    setSelectedItem(item);
    setBidAmount(item.currentBid + 10); // Default to current bid + 10
    setPrivateKey(''); // Clear any previous private key
    setBidError(''); // Clear any previous errors
  };

  // Close the bid modal
  const closeBidModal = () => {
    setSelectedItem(null);
    setBidAmount(0);
    setPrivateKey(''); // Clear private key
    setBidError(''); // Clear errors
  };

  // Submit a bid for an auction item
  const submitBid = async () => {
    if (!selectedItem) return;
    
    // Validate inputs
    if (!privateKey) {
      setBidError('Please enter your private key');
      return;
    }
    
    if (bidAmount <= selectedItem.currentBid) {
      setBidError('Your bid must be higher than the current bid');
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Request a challenge from the server
      const challengeResponse = await axios.post('http://127.0.0.1:5000/api/get_challenge', {
        public_key: userPublicKey
      });
      
      const challenge = challengeResponse.data.challenge;
      
      // Step 2: Sign the challenge using the provided private key
      let signedChallenge;
      try {
        // Call the Rust function to sign the challenge
        signedChallenge = await invoke<string>('sign_challenge', {
          challenge: challenge,
          privateKey: privateKey
        });
      } catch (error) {
        setBidError(`Error signing challenge: ${error}`);
        setIsProcessing(false);
        return;
      }
      
      // Step 3: Fetch a signed certificate from the bank API
      // Normally we'd get this from your bank, but for now we'll create a mock one
      const today = new Date().toISOString().split('T')[0];
      const certificate = {
        date: today,
        balance: bidAmount * 2, // Ensure there's enough balance
        client_public_key: userPublicKey
      };
      
      // Step 4: Create bid data to be sent to RISC0
      const bidData = {
        bank_details: {
          cert: certificate,
          bank_sig: "bank-signature-placeholder", // In a real app, this would come from your bank API
          bank_public_key: "bank-public-key-placeholder"
        },
        bid: bidAmount,
        challenge: challenge,
        signed_challenge: signedChallenge,
        item_id: selectedItem.id
      };
      
      // Step 5: Generate RISC0 proof
      try {
        // Call the Rust function to generate proof
        // In a real implementation, this would call your RISC0 prover
        const proofReceipt = await invoke<string>('create_bid_proof', {
          cert: JSON.stringify(certificate),
          certSig: "bank-signature-placeholder",
          bankPubKey: "bank-public-key-placeholder",
          privateKey: privateKey,
          challenge: challenge,
          itemId: selectedItem.id,
          bidAmount: bidAmount
        });
        
        // Step 6: Submit the proof to the server
        await axios.post('http://127.0.0.1:5000/api/submit_bid_proof', {
          proof_receipt: proofReceipt,
          challenge: challenge,
          item_id: selectedItem.id,
          bid_amount: bidAmount
        });
        
        // Update the auction item with the new bid
        setAuctionItems(items => 
          items.map(item => 
            item.id === selectedItem.id 
              ? { ...item, currentBid: bidAmount } 
              : item
          )
        );

        displayMessage(`Bid of $${bidAmount} placed successfully!`, "success");
        closeBidModal();
      } catch (error) {
        console.error("Error creating/submitting proof:", error);
        setBidError(`Error processing bid: ${error}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setBidError(error.response?.data?.error || 'Failed to place bid');
      } else {
        setBidError(`An error occurred: ${error}`);
      }
    } finally {
      setIsProcessing(false);
      setPrivateKey(''); // Always clear the private key for security
    }
  };

  // View my bids (redirects to user profile/receipts page)
  const viewMyBids = () => {
    navigateTo("profile");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Anonymous Auction</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, {username}</span>
            <button 
              onClick={viewMyBids}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              My Bids
            </button>
            <button 
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Message display */}
        {message && (
          <div 
            className={`mb-6 p-4 rounded-md ${
              messageType === "error" 
                ? "bg-red-100 text-red-700 border border-red-200" 
                : messageType === "success" 
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-blue-100 text-blue-700 border border-blue-200"
            }`}
          >
            {message}
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6">Current Auctions</h2>
        
        {/* Auction Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctionItems.map(item => (
            <div 
              key={item.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-48 object-cover"
              />
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
                    <p className="text-sm font-medium text-orange-600">
                      {getTimeRemaining(item.endTime)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openBidModal(item)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-medium"
                >
                  Place Bid
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bid Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Place a Bid on {selectedItem.title}</h3>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Current Bid: ${selectedItem.currentBid}</p>
              <p className="text-gray-600 mb-4">Auction Ends: {formatDate(selectedItem.endTime)}</p>
              
              {/* Bid amount input */}
              <label className="block text-gray-700 font-medium mb-2">Your Bid Amount</label>
              <input
                type="number"
                min={selectedItem.currentBid + 1}
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
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                  {bidError}
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={closeBidModal}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={submitBid}
                disabled={isProcessing || bidAmount <= selectedItem.currentBid || !privateKey}
                className={`bg-green-600 ${
                  isProcessing || bidAmount <= selectedItem.currentBid || !privateKey
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-green-700'
                } text-white font-bold py-2 px-4 rounded`}
              >
                {isProcessing ? "Processing..." : "Confirm Bid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionItemsPage;