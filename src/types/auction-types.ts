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