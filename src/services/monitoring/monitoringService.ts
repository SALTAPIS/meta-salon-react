import { supabase } from '../../lib/supabase';
import type { SystemHealth } from '../../types/monitoring/types';

export class MonitoringService {
  private static instance: MonitoringService;

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async recordMetric(type: string, value: number, context?: Record<string, any>): Promise<string> {
    const { data, error } = await supabase.rpc('record_metric', {
      p_type: type,
      p_value: value,
      p_context: context,
    });

    if (error) throw error;
    return data;
  }

  async getSystemHealth(): Promise<SystemHealth[]> {
    const { data, error } = await supabase.rpc('get_system_health');

    if (error) throw error;
    return data;
  }
} 