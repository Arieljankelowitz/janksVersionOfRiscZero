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
import { fetchAuction, fetchChallenge } from "@/services/auction-services"
import { AuctionItem } from "@/types/auction-types"
import { signChallenge, submitBid } from "@/services/rust-services"
import axios from "axios"
import { BankDetails, Cert } from "@/types/bank-types"

interface AuctionPageProps {
  username: string;
}

const AuctionPage: React.FC<AuctionPageProps> = ({ username }) => {
  const [currentBid, setCurrentBid] = useState(150)
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
  const bankServerUrl = "http://127.0.0.1:5000/api"

  useEffect(() => {
    const getAuctionData = async () => {
      const data = await fetchAuction();
      setAuctionData(data);
      setCurrentBid(data?.bid || 0)
    };

    const getUserCert = async () => {
      const response = await axios.get<BankDetails>(`${bankServerUrl}/cert/${username}`)
      setBankDetails(response.data)
    }

    getAuctionData();
    getUserCert();
  }, []);


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

      setError(signature) // remove this at some point

      // send bid details to zkvm
      const bidDetails = {
        bank_details,
        bid: pendingBidAmount,
        challenge: challenge,
        signed_challenge: signature
      };

      const bidReceipt = submitBid(bidDetails)
      // somehow connect to websocket and submit the bid also prob need to connect to websocket above look into it

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
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl md:text-3xl">{auctionData?.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative aspect-square">
              <img
                src="/placeholder.svg?height=600&width=600"
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
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Current Bid</h2>
                <p className="text-3xl font-bold text-primary">${currentBid.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Auction ends in 2 days, 4 hours</p>
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
            <div>Welcome {username}</div>
            <div>
              Maximum suggested bid: <span className="font-medium">${(currentBid * 1.5).toFixed(2)}</span>
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
              {error && <p className="text-xs text-muted-foreground text-red-500">{error}</p>}
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