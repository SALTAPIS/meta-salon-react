## User Management Endpoints

### Get User Profile
```typescript
GET /api/users/:id

Response:
{
  id: string;
  role: string;
  wallet: string;
  balance: number;
  votePacks: VotePack[];
  stats: {
    challengesEntered: number;
    challengesWon: number;
    totalVotesCast: number;
    totalRewardsEarned: number;
  };
}
```

### Update User Settings
```typescript
PATCH /api/users/:id/settings

Request:
{
  notifications?: {
    email: boolean;
    push: boolean;
    challenges: boolean;
    rewards: boolean;
  };
  display?: {
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
}

Response:
{
  settings: UserSettings;
  updated: string[];
}
```

### Get User Activity
```typescript
GET /api/users/:id/activity

Query Parameters:
{
  type?: 'challenges' | 'votes' | 'rewards';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

Response:
{
  activities: Activity[];
  total: number;
  hasMore: boolean;
}
```