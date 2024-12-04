## API Routes

### Authentication
- POST /api/auth/connect
- POST /api/auth/disconnect
- GET /api/auth/verify

### Challenges
- GET /api/challenges
- POST /api/challenges/create
- POST /api/challenges/:id/enter
- POST /api/challenges/:id/vote
- GET /api/challenges/:id/results

### Token System
- GET /api/vault/balance
- POST /api/vault/grant
- GET /api/vault/metrics

### Users
- GET /api/users/:id
- GET /api/users/:id/vote-packs
- GET /api/users/:id/challenges
- GET /api/users/:id/rewards