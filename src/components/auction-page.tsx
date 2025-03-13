import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { daysUntilEnd, fetchAuction, fetchAllAuctions, fetchChallenge } from "@/services/auction-services"
import { AuctionItem, BidUpdate, ErrorMessage } from "@/types/auction-types"
import { signChallenge, submitBid } from "@/services/rust-services"
import axios from "axios"
import { BankDetails } from "@/types/bank-types"
import { io, Socket } from 'socket.io-client';
import { Clock, LogOut, ArrowRight } from "lucide-react"

interface AuctionPageProps {
  username: string;
  setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuctionPage: React.FC<AuctionPageProps> = ({ username, setLoggedIn }) => {
  const [currentBid, setCurrentBid] = useState(150)
  const [bidAmount, setBidAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [challenge, setChallenge] = useState<string>("")
  const [secretKey, setSecretKey] = useState("")
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false)
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null)
  const [auctionData, setAuctionData] = useState<AuctionItem | null>(null)
  const [allAuctions, setAllAuctions] = useState<AuctionItem[]>([])
  const [error, setError] = useState("");
  const [bank_details, setBankDetails] = useState<BankDetails | null>(null)
  const [connected, setConnected] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>("2"); // Default auction ID

  const bankServerUrl = "http://127.0.0.1:5000/api"
  const auctionServerUrl = 'http://127.0.0.1:5001'

  // Initialize socket connection
  useEffect(() => {
    // Create socket connection
    const newSocket: Socket = io(auctionServerUrl);

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
      if (String(data.auction_id) === String(selectedAuctionId)) {
        console.log(`New bid received: ${data.new_bid}`);
        setCurrentBid(data.new_bid);
      }
      
      // Also update the auction in the all auctions list
      setAllAuctions(prevAuctions => 
        prevAuctions.map(auction => 
          String(auction.id) === String(data.auction_id)
            ? { ...auction, bid: data.new_bid } 
            : auction
        )
      );
    });

    // Listen for error messages
    newSocket.on('error', (data: ErrorMessage) => {
      setError(data.message);
    });

    // Store socket in state
    setSocket(newSocket);

    // Cleanup on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Get all auctions
    const getAllAuctions = async () => {
      try {
        const auctions = await fetchAllAuctions();
        setAllAuctions(auctions);
      } catch (error) {
        console.error("Failed to fetch all auctions:", error);
      }
    };

    getAllAuctions();
  }, []);

  useEffect(() => {
    const getAuctionData = async () => {
      try {
        const data = await fetchAuction(selectedAuctionId);
        setAuctionData(data);
        setCurrentBid(data?.bid || 0);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const cleanError = errorMsg.includes("status code") 
          ? "Unable to load auction data" 
          : `Error: ${errorMsg}`;
        setError(cleanError);
      }
    };

    const getBankDetails = async () => {
      try {
        const response = await axios.get<BankDetails>(`${bankServerUrl}/cert/${username}`);
        setBankDetails(response.data);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const cleanError = errorMsg.includes("status code") 
          ? "Unable to load your account details" 
          : `Error: ${errorMsg}`;
        setError(cleanError);
      }
    };

    getAuctionData();
    getBankDetails();
  }, [username, selectedAuctionId]);

  async function waitOneSecond() {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const selectAuction = (auctionId: string) => {
    setSelectedAuctionId(String(auctionId));
    setError("");
    setBidAmount("");
  };

  // Initial validation and modal opening
  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    const amount = Number.parseFloat(bidAmount)
    
    if (isNaN(amount)) {
      setError("Please enter a valid bid amount");
      return;
    }
    
    if (amount <= currentBid) {
      setError("Bid must be higher than the current bid");
      return;
    }
    
    const maxBalance = bank_details?.cert?.balance ? Number(bank_details.cert.balance) : 0;
    if (amount > maxBalance) {
      setError("Bid exceeds your available balance");
      return;
    }

    // Store the pending bid amount and open the modal
    setPendingBidAmount(amount)
    setIsModalOpen(true)
    
    // Fetch challenge when modal opens
    try {
      setIsLoadingChallenge(true)
      setChallenge(await fetchChallenge() || "")
    } catch (error) {
      console.error("Failed to fetch challenge:", error)
      setError("Failed to generate challenge. Please try again.")
      setIsModalOpen(false)
    } finally {
      setIsLoadingChallenge(false)
    }
  }

  // Handle signing and completing the bid
  const handleSignAndBid = async () => {
    setIsSubmitting(true)
    setError("")

    try {
      // sign the challenge
      const signature = await signChallenge(challenge, secretKey)

      // send bid details to zkvm
      const bidDetails = {
        bank_details,
        bid: pendingBidAmount,
        challenge: challenge,
        signed_challenge: signature
      };

      await waitOneSecond()
      const bidReceipt = await submitBid(bidDetails)

      if ((bidReceipt as string).startsWith("Error")) {
        throw new Error(bidReceipt as string);
      }

      placeBid(bidReceipt)
      setIsSubmitting(false)
      handleModalClose()

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const cleanError = errorMsg.includes("status code") 
        ? "Verification failed. Check your key and try again." 
        : errorMsg.replace("Error:", "");
      setError(cleanError);
      setIsSubmitting(false)
    }
  }

  // Reset state when modal closes
  const handleModalClose = () => {
    if (!isSubmitting) {
      setSecretKey("")
      setChallenge("")
      setPendingBidAmount(null)
      setBidAmount("")
      setIsModalOpen(false)
      setError("")
    }
  }

  const placeBid = (receipt: any): void => {
    if (!socket || !connected) {
      setError('Socket not connected. Please refresh the page and try again.');
      return;
    }

    if (!receipt.trim()) {
      setError('Receipt cannot be empty. Please try again.');
      return;
    }

    socket.emit('place_bid', {
      auction_id: String(selectedAuctionId),
      receipt: receipt
    });
  };

  const onLogout = () => {
    setLoggedIn(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900">ZeroBid Anonymous Auction</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <span>Hello, {username}</span>
              <span className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout} 
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="text-sm">Sign out</span>
            </Button>
          </div>
        </div>

        {/* Account Balance Card */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Your Available Balance</p>
              <p className="text-xl font-bold text-gray-900">
                ${bank_details?.cert?.balance ? Number(bank_details.cert.balance).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {connected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </div>

        {/* All Auctions Grid */}
        {allAuctions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Available Auctions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allAuctions.map((auction) => (
                <Card 
                  key={auction.id} 
                  className={`overflow-hidden cursor-pointer transition hover:shadow-md ${selectedAuctionId === String(auction.id) ? 'border-2 border-indigo-500' : 'border border-gray-200'}`}
                  onClick={() => selectAuction(String(auction.id))}
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {auction.img_url ? (
                      <img src={auction.img_url} alt={auction.title} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                    {String(selectedAuctionId) === String(auction.id) && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                        Selected
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-gray-900 truncate">{auction.title}</h3>
                    <div className="mt-1 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current bid:</span>
                      <span className="font-bold text-indigo-600">${auction.bid.toFixed(2)}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{daysUntilEnd(auction.end_date ?? "")}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main auction card */}
        {auctionData && (
          <Card className="overflow-hidden border-0 shadow-lg mb-6">
            <CardHeader className="bg-gray-50 px-6 py-4 border-b">
              <CardTitle className="flex justify-between items-center">
                <span className="text-xl font-medium">{auctionData.title}</span>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{daysUntilEnd(auctionData.end_date ?? "")}</span>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="bg-gray-100 flex items-center justify-center p-4">
                  {auctionData.img_url ? (
                    <img
                      src={auctionData.img_url}
                      alt={auctionData.title}
                      className="object-contain max-h-80 max-w-full"
                    />
                  ) : (
                    <div className="h-80 w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">Image not available</span>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
                    <p className="text-gray-600">
                      {auctionData.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Current Bid</h2>
                    <p className="text-3xl font-bold text-indigo-600">${currentBid.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mt-1">Next minimum bid: ${(currentBid + 0.01).toFixed(2)}</p>
                  </div>

                  {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm border border-red-200">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-red-500">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="text-red-800">{error}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleBidSubmit}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bid-amount" className="text-sm font-medium">
                          Your Bid
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            id="bid-amount"
                            type="number"
                            step="0.01"
                            min={currentBid + 0.01}
                            placeholder={`${(currentBid + 10).toFixed(2)}`}
                            className="pl-7 h-10"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700"
                      >
                        Place Anonymous Bid
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-gray-50 p-4 border-t text-xs text-gray-500">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
                All bids are secured using zero-knowledge proofs for maximum privacy
              </div>
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Challenge Verification Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (open === false && !isSubmitting) {
            handleModalClose();
          } else {
            setIsModalOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium">Verify Your Bid</DialogTitle>
            <DialogDescription className="text-gray-600">
              To place your bid of ${pendingBidAmount?.toFixed(2)}, sign the challenge with your private key.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="challenge" className="text-sm font-medium">Challenge</Label>
              <div className="p-3 bg-gray-100 rounded-md break-all text-sm font-mono text-gray-800">
                {isLoadingChallenge ? (
                  <div className="flex items-center justify-center h-8">
                    <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : challenge ? (
                  challenge
                ) : (
                  <div className="flex items-center justify-center h-8">
                    <p className="text-gray-500">Failed to load challenge</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret-key" className="text-sm font-medium">Your Private Key</Label>
              <Input
                id="secret-key"
                type="password"
                placeholder="Paste your private key here"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Your private key is never stored and only used to sign this challenge.
              </p>
              
              {error && (
                <div className="mt-2 rounded-md bg-red-50 p-3 text-sm border border-red-200">
                  <div className="flex items-start space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-red-500">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex space-x-2 sm:justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsModalOpen(false)} 
              disabled={isSubmitting}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSignAndBid}
              disabled={isSubmitting || isLoadingChallenge || !challenge}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </div>
              ) : "Sign & Place Bid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AuctionPage