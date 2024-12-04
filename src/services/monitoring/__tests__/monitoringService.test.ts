import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonitoringService } from '../monitoringService';
import { supabase } from '../../../lib/supabase';
import type { SystemHealth } from '../../../types/monitoring/types';

// Mock the Supabase client
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(),
  },
}));

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;

  beforeEach(() => {
    vi.clearAllMocks();
    monitoringService = MonitoringService.getInstance();
  });

  describe('recordMetric', () => {
    it('should record a metric successfully', async () => {
      const mockMetricId = 'metric-id';
      const mockRpc = vi.fn().mockResolvedValueOnce({
        data: mockMetricId,
        error: null,
      });
      (supabase.rpc as any) = mockRpc;

      const result = await monitoringService.recordMetric(
        'performance',
        100,
        { page: 'home' }
      );

      expect(result).toBe(mockMetricId);
      expect(mockRpc).toHaveBeenCalledWith('record_metric', {
        p_type: 'performance',
        p_value: 100,
        p_context: { page: 'home' },
      });
    });
  });

  describe('getSystemHealth', () => {
    it('should get system health successfully', async () => {
      const mockHealth: SystemHealth[] = [
        {
          component: 'database',
          status: 'healthy',
          last_check: new Date().toISOString(),
          details: { latency: 50 },
        },
      ];

      const mockRpc = vi.fn().mockResolvedValueOnce({
        data: mockHealth,
        error: null,
      });
      (supabase.rpc as any) = mockRpc;

      const result = await monitoringService.getSystemHealth();

      expect(result).toEqual(mockHealth);
      expect(mockRpc).toHaveBeenCalledWith('get_system_health');
    });
  });
}); 