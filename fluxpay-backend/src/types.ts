export interface User {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  phone_number?: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPublic {
  id: string;
  email?: string;
  phone_number?: string;
  display_name: string;
  avatar_url?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  linked_bank?: string;
  weekly_limit: number;
  available_balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletResponse {
  id: string;
  balance: number;
  currency: string;
  linked_bank?: string;
  weekly_limit: number;
  available_balance: number;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: 'send' | 'receive' | 'request' | 'transfer' | 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  counterparty_name: string;
  description: string;
  note?: string;
  created_at: string;
}

export interface TransactionRecord {
  id: string;
  sender_wallet_id: string;
  receiver_wallet_id: string | null;
  amount: number;
  currency: string;
  type: string;
  status: string;
  counterparty_name: string;
  description: string;
  note: string | null;
  created_at: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    display_name?: string;
    phone_number?: string;
  };
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  full_name: string;
  display_name?: string;
  phone_number?: string;
  avatar_url?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}