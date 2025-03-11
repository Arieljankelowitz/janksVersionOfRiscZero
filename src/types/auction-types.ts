export interface AuctionItem {
    id: number;
    title: string;
    description: string;
    img_url: string;
    bid: number;
    created_at: string; // or Date if you parse it
    end_date: string; // or Date
}

export interface Challenge {
    challenge: string;
}

export interface BidUpdate {
    auction_id: string;
    new_bid: number;
}

export interface ErrorMessage {
    message: string;
}
