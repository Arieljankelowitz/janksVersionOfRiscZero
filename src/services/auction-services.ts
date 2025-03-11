import axios from "axios"
import { AuctionItem, Challenge } from "@/types/auction-types"

const auctionServerUrl = "http://127.0.0.1:5001/api"

export const fetchAuction = async (auctionId: string) => {
    try{
        const auctionResponse = await axios.get<AuctionItem>(`${auctionServerUrl}/auction/${auctionId}`)
        
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

export function daysUntilEnd(dateString: string): string {
    // Parse the date string to a Date object
    const endDate = new Date(dateString);
    
    // Get the current date
    const currentDate = new Date();
    
    // Calculate the difference in milliseconds and convert to days
    const timeDifference = endDate.getTime() - currentDate.getTime();
    const daysLeft = Math.ceil(timeDifference / (1000 * 3600 * 24));
    
    // Return the formatted string
    return `Ends in ${daysLeft} days`;
}