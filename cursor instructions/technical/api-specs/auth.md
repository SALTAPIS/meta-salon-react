## Authentication Endpoints

### Connect Wallet
```typescript
POST /api/auth/connect

Request:
{
  address: string;
  signature: string;
  message: string;
}

Response:
{
  user: {
    id: string;
    role: 'guest' | 'user' | 'member' | 'moderator' | 'admin';
    wallet: string;
    balance: number;
    premiumUntil?: Date;
  };
  token: string;
}
```

### Verify Session
```typescript
GET /api/auth/verify

Headers:
{
  Authorization: 'Bearer '
}

Response:
{
  isValid: boolean;
  user?: User;
}
```

### Disconnect Wallet
```typescript
POST /api/auth/disconnect

Headers:
{
  Authorization: 'Bearer '
}

Response:
{
  success: boolean;
}
```