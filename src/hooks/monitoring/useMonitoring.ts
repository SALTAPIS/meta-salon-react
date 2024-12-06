import { useState, useEffect } from 'react';
import { MonitoringService } from '../../services/monitoring/monitoringService';
import type { 
  Transaction,
  UserProfile,
  UserRole
} from '../../types/monitoring/types';

interface MonitoringData {
  userStats: {
    total: number;
    active: number;
    newToday: number;
  };
  transactions: Transaction[];
  users: {
    list: UserProfile[];
    total: number;
    page: number;
    limit: number;
    filters?: {
      role?: UserRole;
      search?: string;
    };
  };
  isLoading: boolean;
  error: Error | null;
}

export function useMonitoring() {
  const [data, setData] = useState<MonitoringData>({
    userStats: {
      total: 0,
      active: 0,
      newToday: 0,
    },
    transactions: [],
    users: {
      list: [],
      total: 0,
      page: 1,
      limit: 10,
    },
    isLoading: true,
    error: null,
  });

  const monitoringService = MonitoringService.getInstance();

  const fetchData = async () => {
    try {
      const [
        userStats,
        transactions,
        usersData,
      ] = await Promise.all([
        monitoringService.getUserStats(),
        monitoringService.getTransactionHistory(),
        monitoringService.getUsers(data.users.page, data.users.limit, data.users.filters),
      ]);

      setData({
        userStats,
        transactions,
        users: {
          ...data.users,
          list: usersData.users,
          total: usersData.total,
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [data.users.page, data.users.limit, data.users.filters]);

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      await monitoringService.updateUserRole(userId, role);
      await fetchData(); // Refresh data after updating role
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  const getUserTransactions = async (userId: string, limit: number = 10) => {
    try {
      return await monitoringService.getUserTransactions(userId, limit);
    } catch (error) {
      console.error('Error getting user transactions:', error);
      throw error;
    }
  };

  const setUserFilters = (filters: MonitoringData['users']['filters']) => {
    setData(prev => ({
      ...prev,
      users: {
        ...prev.users,
        filters,
        page: 1, // Reset to first page when filters change
      },
    }));
  };

  const setUsersPage = (page: number) => {
    setData(prev => ({
      ...prev,
      users: {
        ...prev.users,
        page,
      },
    }));
  };

  const setUsersLimit = (limit: number) => {
    setData(prev => ({
      ...prev,
      users: {
        ...prev.users,
        limit,
        page: 1, // Reset to first page when limit changes
      },
    }));
  };

  return {
    ...data,
    updateUserRole,
    getUserTransactions,
    setUserFilters,
    setUsersPage,
    setUsersLimit,
    refresh: fetchData,
  };
} 