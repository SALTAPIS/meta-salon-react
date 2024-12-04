export type MetricType = 'vault_balance' | 'user_count' | 'transaction_volume' | 'active_challenges' | 'system_health';
export type AlertCondition = 'above' | 'below' | 'equals';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type AlertStatus = 'triggered' | 'acknowledged' | 'resolved';

export interface SystemMetric {
  id: string;
  metric_type: MetricType;
  value: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AlertConfig {
  id: string;
  metric_type: MetricType;
  threshold: number;
  condition: AlertCondition;
  severity: AlertSeverity;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertHistory {
  id: string;
  config_id?: string;
  metric_type: MetricType;
  metric_value: number;
  threshold: number;
  severity: AlertSeverity;
  status: AlertStatus;
  resolved_at?: string;
  created_at: string;
}

export interface SystemHealth {
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  last_check: string;
  details?: Record<string, any>;
}

export interface MonitoringState {
  metrics: SystemMetric[];
  alerts: AlertHistory[];
  configs: AlertConfig[];
  health: SystemHealth[];
  isLoading: boolean;
  error: Error | null;
} 