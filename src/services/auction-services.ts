import axios from 'axios';
import { AuctionItem } from '@/types/auction-types';

const API_URL = 'http://127.0.0.1:5001/api';

// Function to fetch all auctions
export const fetchAllAuctions = async (): Promise<AuctionItem[]> => {
  try {
    const response = await axios.get(`${API_URL}/auctions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all auctions:', error);
    throw error;
  }
};

// Function to fetch a single auction by ID
export const fetchAuction = async (auctionId: string): Promise<AuctionItem> => {
  try {
    const response = await axios.get(`${API_URL}/auction/${auctionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching auction ${auctionId}:`, error);
    throw error;
  }
};

// Function to fetch a challenge from the server
export const fetchChallenge = async (): Promise<string | null> => {
  try {
    const response = await axios.get(`${API_URL}/challenge`);
    return response.data.challenge;
  } catch (error) {
    console.error('Error fetching challenge:', error);
    throw error;
  }
};

// Helper function to format the days remaining until auction end
export const daysUntilEnd = (endDateStr: string): string => {
  if (!endDateStr) return 'No end date';
  
  try {
    const endDate = new Date(endDateStr);
    const now = new Date();
    
    // Calculate the difference in milliseconds
    const diffTime = endDate.getTime() - now.getTime();
    
    // If the auction has ended
    if (diffTime <= 0) {
      return 'Auction ended';
    }
    
    // Calculate days, hours, minutes
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} left`;
    } else {
      const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} left`;
    }
  } catch (error) {
    console.error('Error calculating days until end:', error);
    return 'Unknown time left';
  }
};