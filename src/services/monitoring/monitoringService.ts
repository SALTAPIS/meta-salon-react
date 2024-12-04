import { supabase } from '../../lib/supabase';
import type {
  SystemMetric,
  AlertConfig,
  AlertHistory,
  SystemHealth,
  MetricType,
  AlertCondition,
  AlertSeverity,
  AlertStatus
} from '../../types/monitoring/types';

export class MonitoringService {
  async recordMetric(
    metricType: MetricType,
    value: number,
    metadata?: Record<string, any>
  ): Promise<string> {
    const { data, error } = await supabase.rpc('record_metric', {
      p_metric_type: metricType,
      p_value: value,
      p_metadata: metadata
    });

    if (error) throw error;
    return data;
  }

  async getSystemHealth(): Promise<SystemHealth[]> {
    const { data, error } = await supabase.rpc('get_system_health');

    if (error) throw error;
    return data;
  }

  async getMetrics(
    metricType?: MetricType,
    startDate?: Date,
    endDate?: Date
  ): Promise<SystemMetric[]> {
    let query = supabase
      .from('system_metrics')
      .select('*')
      .order('created_at', { ascending: false });

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async getAlertConfigs(metricType?: MetricType): Promise<AlertConfig[]> {
    let query = supabase
      .from('alert_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async createAlertConfig(
    metricType: MetricType,
    threshold: number,
    condition: AlertCondition,
    severity: AlertSeverity
  ): Promise<AlertConfig> {
    const { data, error } = await supabase
      .from('alert_configs')
      .insert({
        metric_type: metricType,
        threshold,
        condition,
        severity,
        enabled: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAlertConfig(
    id: string,
    updates: Partial<Omit<AlertConfig, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<AlertConfig> {
    const { data, error } = await supabase
      .from('alert_configs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAlertHistory(
    status?: AlertStatus,
    startDate?: Date,
    endDate?: Date
  ): Promise<AlertHistory[]> {
    let query = supabase
      .from('alert_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async updateAlertStatus(
    id: string,
    status: AlertStatus,
    resolvedAt?: Date
  ): Promise<AlertHistory> {
    const { data, error } = await supabase
      .from('alert_history')
      .update({
        status,
        resolved_at: resolvedAt?.toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 