## Monitoring Endpoints

### System Health Check
```typescript
GET /api/monitoring/health

Response:
{
  status: 'healthy' | 'degraded' | 'critical';
  services: {
    database: {
      status: string;
      latency: number;
    };
    cache: {
      status: string;
      hitRate: number;
    };
    storage: {
      status: string;
      usage: number;
    };
  };
  metrics: {
    requestRate: number;
    errorRate: number;
    avgResponseTime: number;
  };
}
```

### Performance Metrics
```typescript
GET /api/monitoring/metrics

Query Parameters:
{
  timeframe: '1h' | '24h' | '7d' | '30d';
  metrics: string[];
}

Response:
{
  timeframe: string;
  dataPoints: {
    timestamp: Date;
    metrics: Record<string, number>;
  }[];
  summary: {
    min: Record<string, number>;
    max: Record<string, number>;
    avg: Record<string, number>;
  };
}
```