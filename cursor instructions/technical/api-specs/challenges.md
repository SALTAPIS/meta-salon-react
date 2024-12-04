## Challenge System Endpoints

### Create Challenge
```typescript
POST /api/challenges

Request:
{
  type: 'main' | 'public' | 'private';
  startTime: Date;
  endTime: Date;
  settings: {
    maxEntries?: number;
    votingDuration: number;
    rewardDistribution: {
      first: number;
      second: number;
      third: number;
      participants: number;
    };
  };
}

Response:
{
  challenge: Challenge;
  status: 'created';
}
```

### Submit Entry
```typescript
POST /api/challenges/:id/entries

Request:
{
  content: {
    title: string;
    description: string;
    mediaUrl: string;
  };
  metadata?: Record<string, any>;
}

Response:
{
  entry: ChallengeEntry;
  status: 'submitted';
}
```

### Cast Vote
```typescript
POST /api/challenges/:id/vote

Request:
{
  entryId: string;
  votePackId: string;
  power: number;
}

Response:
{
  vote: Vote;
  remainingVotes: number;
  status: 'recorded';
}
```