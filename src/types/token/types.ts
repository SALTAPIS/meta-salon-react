export type TransactionType = 'grant' | 'submission' | 'vote_pack' | 'reward' | 'premium' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fee: number;
  sender: string;
  recipient: string;
  timestamp: Date;
  status: TransactionStatus;
  metadata?: {
    challengeId?: string;
    votePackType?: string;
    submissionId?: string;
    premiumDuration?: number;
  };
}

export interface VaultBalance {
  total: number;
  reserved: number;  // Minimum 20,000 SLN
  available: number;
  dailyGrants: number;
  healthStatus: 'healthy' | 'warning' | 'critical' | 'emergency';
}

export interface TokenMetrics {
  currentPrice: number;  // Fixed at $0.01 USD
  totalSupply: number;
  circulatingSupply: number;
  marketFeePercentage: number; // 2.18%
}

export type VotePackType = 'basic' | 'art_lover' | 'pro' | 'expert' | 'elite'; 