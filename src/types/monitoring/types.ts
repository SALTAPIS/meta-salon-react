export type UserRole = 'guest' | 'user' | 'member' | 'moderator' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  balance: number;
  wallet: string | null;
  avatar_url: string | null;
  last_active: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'grant' | 'submission' | 'vote_pack' | 'reward' | 'premium' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  profiles?: UserProfile;
} 