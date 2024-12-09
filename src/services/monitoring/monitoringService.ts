import { supabase } from '../../lib/supabaseClient';
import type { 
  UserProfile,
  Transaction,
  UserRole
} from '../../types/monitoring/types';

export class MonitoringService {
  private static instance: MonitoringService;

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async getTransactionHistory(limit: number = 10): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          user_id,
          type,
          amount,
          status,
          description,
          metadata,
          created_at,
          updated_at,
          profiles (
            id,
            email,
            role,
            balance,
            wallet,
            avatar_url,
            last_active,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as unknown as Transaction[]) || [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    newToday: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: totalUsers, error: totalError } = await supabase
        .from('profiles')
        .select('count');

      const { data: activeUsers, error: activeError } = await supabase
        .from('profiles')
        .select('count')
        .gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: newUsers, error: newError } = await supabase
        .from('profiles')
        .select('count')
        .gt('created_at', today.toISOString());

      if (totalError || activeError || newError) throw totalError || activeError || newError;

      return {
        total: totalUsers?.[0]?.count || 0,
        active: activeUsers?.[0]?.count || 0,
        newToday: newUsers?.[0]?.count || 0,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async getUsers(
    page: number = 1,
    limit: number = 10,
    filters?: {
      role?: UserRole;
      search?: string;
    }
  ): Promise<{ users: UserProfile[]; total: number }> {
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (filters?.role) {
        query = query.eq('role', filters.role);
      }

      if (filters?.search) {
        query = query.ilike('email', `%${filters.search}%`);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        users: (data as unknown as UserProfile[]) || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async getUserTransactions(userId: string, limit: number = 10): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          user_id,
          type,
          amount,
          status,
          description,
          metadata,
          created_at,
          updated_at,
          profiles (
            id,
            email,
            role,
            balance,
            wallet,
            avatar_url,
            last_active,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as unknown as Transaction[]) || [];
    } catch (error) {
      console.error('Error getting user transactions:', error);
      throw error;
    }
  }
} 