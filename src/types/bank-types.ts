export interface Cert {
    balance: Number;
    client_public_key: string;
}

export interface BankDetails {
    cert: Cert;
    bank_sig: string;
    bank_public_key: string;
}