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
import { daysUntilEnd, fetchAuction, fetchChallenge } from "@/services/auction-services"
import { AuctionItem, BidUpdate, ErrorMessage } from "@/types/auction-types"
import { signChallenge, submitBid } from "@/services/rust-services"
import axios from "axios"
import { BankDetails } from "@/types/bank-types"
import { io, Socket } from 'socket.io-client';
import { LogOut } from "lucide-react"


interface AuctionPageProps {
  username: string;
  setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuctionPage: React.FC<AuctionPageProps> = ({ username, setLoggedIn }) => {
  const [currentBid, setCurrentBid] = useState(150) // setup websocket to auto update 
  const [bidAmount, setBidAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [challenge, setChallenge] = useState<string>("")
  const [secretKey, setSecretKey] = useState("")
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false)
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null)
  const [auctionData, setAuctionData] = useState<AuctionItem | null>(null)
  const [error, setError] = useState("");  // To show errors
  const [bank_details, setBankDetails] = useState<BankDetails | null>(null)
  const [connected, setConnected] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [bidDetailsTest, setBidDetails] = useState(""); // remove

  const bankServerUrl = "http://127.0.0.1:5000/api"
  const auctionServerUrl = 'http://127.0.0.1:5001'
  const auctionId = '2'

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
      if (data.auction_id === auctionId) {
        console.log(`New bid received: $${data.new_bid}`);
        setCurrentBid(data.new_bid);
      }
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
    const getAuctionData = async () => {
      try {
        const data = await fetchAuction(auctionId);
        setAuctionData(data);
        setCurrentBid(data?.bid || 0);
      } catch (error) {
        setError(`Error fetching auction data: ${error}`);
      }
    };

    const getBankDetails = async () => {
      try {
        const response = await axios.get<BankDetails>(`${bankServerUrl}/cert/${username}`);
        setBankDetails(response.data);
      } catch (error) {
        setError(`Error fetching cert: ${error}`);
      }
    };


    getAuctionData();
    getBankDetails();
  }, []);


  async function waitOneSecond() {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Initial validation and modal opening
  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = Number.parseFloat(bidAmount)

    // Store the pending bid amount and open the modal
    setPendingBidAmount(amount)
    setIsModalOpen(true)
    // Fetch challenge when modal opens
    try {
      setIsLoadingChallenge(true)
      setChallenge(await fetchChallenge() || "")
    } catch (error) {
      console.error("Failed to fetch challenge:", error)
      setIsModalOpen(false)
    } finally {
      setIsLoadingChallenge(false)
    }

  }

  // Handle signing and completing the bid
  const handleSignAndBid = async () => {
    setIsSubmitting(true)

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
      setBidDetails(JSON.stringify(bidDetails, null, 2)) //remove
      const bidReceipt = await submitBid(bidDetails)

      if ((bidReceipt as string).startsWith("Error")) {
        throw new Error(bidReceipt as string);
      }

      placeBid(bidReceipt)
      setIsSubmitting(false)
      handleModalClose()

    } catch (error) {
      setError(`${error}`);
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
    }
  }

  const placeBid = (receipt: any): void => {
    if (!socket || !connected) {
      setError('Socket not connected');
      return;
    }

    if (!receipt.trim()) {
      setError('Receipt cannot be empty');
      return;
    }

    socket.emit('place_bid', {
      auction_id: auctionId,
      receipt: receipt
    });

  };

  const onLogout = () => {
    setLoggedIn(false)
  }


  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl md:text-3xl">{auctionData?.title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative aspect-square">
              <img
                src={auctionData?.img_url}
                alt="Vintage Leather Armchair"
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">
                  {auctionData?.description}
                </p>
                {/* <pre>{bidDetailsTest}</pre> */}
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Current Bid</h2>
                <p className="text-3xl font-bold text-primary">${currentBid.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">{daysUntilEnd(auctionData?.end_date ?? "")}</p>
              </div>

              <form onSubmit={handleBidSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bid-amount">Place Your Bid</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="bid-amount"
                        type="number"
                        step="0.01"
                        min={currentBid + 0.01}
                        placeholder={`${(currentBid + 10).toFixed(2)}`}
                        className="pl-7"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter an amount greater than ${currentBid.toFixed(2)}
                    </p>
                  </div>
                  <Button type="submit" className="w-full">
                    Place Bid
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-4 text-sm text-muted-foreground">
          <div className="flex justify-between w-full">
            <div className="flex items-center gap-2">
              Welcome {username}
              <span
                className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
                title={connected ? "Connected" : "Disconnected"}
              />
              <span className="text-xs text-muted-foreground">{connected ? "Online" : "Offline"}</span>
            </div>
            <div>
              Maximum allowed bid: <span className="font-medium">${bank_details?.cert.balance ? bank_details.cert.balance.toString() : '0'}</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Challenge Verification Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) handleModalClose()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Your Bid</DialogTitle>
            <DialogDescription>
              To place your bid of ${pendingBidAmount?.toFixed(2)}, please sign the challenge with your secret key.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="challenge">Challenge</Label>
              <div className="p-3 bg-muted rounded-md break-all text-sm font-mono">
                {isLoadingChallenge ? (
                  <div className="flex items-center justify-center h-8">
                    <p className="text-muted-foreground">Loading challenge...</p>
                  </div>
                ) : challenge ? (
                  challenge
                ) : (
                  <div className="flex items-center justify-center h-8">
                    <p className="text-muted-foreground">Failed to load challenge</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret-key">Your Secret Key</Label>
              <Input
                id="secret-key"
                type="password"
                placeholder="Paste your secret key here"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your secret key is never stored and only used to sign this challenge.
              </p>
              {error && <pre className="text-xs text-muted-foreground text-red-500">{error}</pre>}
            </div>
          </div>

          <DialogFooter className="flex space-x-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSignAndBid}
              disabled={isSubmitting || isLoadingChallenge || !challenge}
            >
              {isSubmitting ? "Verifying bid details..." : "Sign & Place Bid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AuctionPage