import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../../lib/supabase';
import { MonitoringService } from '../monitoringService';
import type { SystemMetric, AlertConfig, AlertHistory, SystemHealth } from '../../../types/monitoring/types';

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;

  beforeEach(() => {
    monitoringService = new MonitoringService();
    vi.clearAllMocks();
  });

  describe('recordMetric', () => {
    it('should record a metric successfully', async () => {
      const mockMetric = {
        metric_type: 'vault_balance',
        value: 1000,
        metadata: { source: 'test' }
      };

      vi.spyOn(supabase.rpc, 'record_metric').mockResolvedValueOnce({
        data: 'metric-id',
        error: null
      });

      const result = await monitoringService.recordMetric(
        mockMetric.metric_type as any,
        mockMetric.value,
        mockMetric.metadata
      );

      expect(result).toBe('metric-id');
      expect(supabase.rpc.record_metric).toHaveBeenCalledWith({
        p_metric_type: mockMetric.metric_type,
        p_value: mockMetric.value,
        p_metadata: mockMetric.metadata
      });
    });
  });

  describe('getSystemHealth', () => {
    it('should get system health status', async () => {
      const mockHealth: SystemHealth[] = [{
        metric_type: 'vault_balance',
        current_value: 1000,
        alert_count: 0,
        last_alert_severity: 'info',
        last_alert_time: new Date().toISOString()
      }];

      vi.spyOn(supabase.rpc, 'get_system_health').mockResolvedValueOnce({
        data: mockHealth,
        error: null
      });

      const result = await monitoringService.getSystemHealth();

      expect(result).toEqual(mockHealth);
      expect(supabase.rpc.get_system_health).toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should get metrics with filters', async () => {
      const mockMetrics: SystemMetric[] = [{
        id: 'metric-1',
        metric_type: 'vault_balance',
        value: 1000,
        created_at: new Date().toISOString()
      }];

      const mockSelect = vi.fn().mockReturnValue({
        data: mockMetrics,
        error: null
      });

      const mockOrder = vi.fn().mockReturnValue({ select: mockSelect });
      const mockLte = vi.fn().mockReturnValue({ order: mockOrder });
      const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
      const mockEq = vi.fn().mockReturnValue({ gte: mockGte });

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: mockOrder,
          eq: mockEq
        })
      } as any);

      const startDate = new Date();
      const endDate = new Date();
      const result = await monitoringService.getMetrics('vault_balance', startDate, endDate);

      expect(result).toEqual(mockMetrics);
    });
  });

  describe('alert management', () => {
    it('should create alert config', async () => {
      const mockConfig: AlertConfig = {
        id: 'config-1',
        metric_type: 'vault_balance',
        threshold: 1000,
        condition: 'below',
        severity: 'warning',
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockSingle = vi.fn().mockReturnValue({
        data: mockConfig,
        error: null
      });

      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });

      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: vi.fn().mockReturnValue({ select: mockSelect })
      } as any);

      const result = await monitoringService.createAlertConfig(
        mockConfig.metric_type,
        mockConfig.threshold,
        mockConfig.condition,
        mockConfig.severity
      );

      expect(result).toEqual(mockConfig);
    });

    it('should update alert status', async () => {
      const mockAlert: AlertHistory = {
        id: 'alert-1',
        metric_type: 'vault_balance',
        metric_value: 900,
        threshold: 1000,
        severity: 'warning',
        status: 'acknowledged',
        created_at: new Date().toISOString()
      };

      const mockSingle = vi.fn().mockReturnValue({
        data: mockAlert,
        error: null
      });

      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });

      vi.spyOn(supabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: mockEq })
      } as any);

      const result = await monitoringService.updateAlertStatus(
        mockAlert.id,
        mockAlert.status,
        new Date()
      );

      expect(result).toEqual(mockAlert);
    });
  });
}); 