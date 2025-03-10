import axios from "axios"
import { AuctionItem, Challenge } from "@/types/auction-types"

const auctionServerUrl = "http://127.0.0.1:5001/api"

export const fetchAuction = async () => {
    try{
        const auctionResponse = await axios.get<AuctionItem>(`${auctionServerUrl}/auction/1`)
        
        return auctionResponse.data

    } catch (error) {
        console.error("Error fetching auction:", error);
        return null
    }
}

export const fetchChallenge = async () => {
    try{
        const challengeResponse = await axios.get<Challenge>(`${auctionServerUrl}/challenge`)
        return challengeResponse.data.challenge
    } catch (error) {
        console.error("Error fetching challenge:", error);
        return null
    }

    
}