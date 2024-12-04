## Token System Endpoints

### Get Vault Balance
```typescript
GET /api/vault/balance

Response:
{
  total: number;
  reserved: number;
  available: number;
  dailyGrants: number;
  healthStatus: 'healthy' | 'warning' | 'critical' | 'emergency';
}
```

### Process Transaction
```typescript
POST /api/vault/transaction

Request:
{
  type: 'grant' | 'submission' | 'votePack' | 'premium' | 'challenge' | 'reward';
  amount: number;
  recipient: string;
  metadata?: {
    challengeId?: string;
    votePackType?: string;
    submissionId?: string;
    premiumDuration?: number;
  };
}

Response:
{
  transaction: {
    id: string;
    status: 'completed' | 'failed';
    fee: number;
    timestamp: Date;
  };
  newBalance: number;
}
```

### Get Transaction History
```typescript
GET /api/vault/transactions

Query Parameters:
{
  startDate?: string;
  endDate?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

Response:
{
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
}
```