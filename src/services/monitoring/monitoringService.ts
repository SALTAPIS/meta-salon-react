import { supabase } from '../../lib/supabase';
import type { SystemHealth } from '../../types/monitoring/types';

type MetricContext = Record<string, string | number | boolean | null>;

export class MonitoringService {
  private static instance: MonitoringService;

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async recordMetric(
    type: string,
    value: number,
    context?: MetricContext
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('system_metrics')
        .insert({
          metric_type: type,
          value: value,
          metadata: context || {}
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error recording metric:', error);
      throw error;
    }
  }

  async getSystemHealth(): Promise<SystemHealth[]> {
    try {
      const { data: dbHealth } = await supabase
        .from('system_metrics')
        .select('*')
        .eq('metric_type', 'health')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return [{
        component: 'database',
        status: (dbHealth?.value ?? 0) > 0 ? 'healthy' : 'degraded',
        last_check: dbHealth?.created_at || new Date().toISOString(),
        details: dbHealth?.metadata || {}
      }];
    } catch (error) {
      console.error('Error getting system health:', error);
      return [{
        component: 'database',
        status: 'degraded',
        last_check: new Date().toISOString(),
        details: { error: 'Failed to fetch health metrics' }
      }];
    }
  }
} 