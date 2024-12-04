# Meta.Salon System Architecture
## Core Components & Interactions

```mermaid
graph TB
    subgraph User Management
        UM1[Guest]
        UM2[User]
        UM3[Member]
        UM4[Moderator]
        UM5[Admin]
    end

    subgraph Token System
        TS1[SLN Token<br>1 SLN = $0.01]
        TS2[Market Fee 2.18%]
        TS3[Transaction Processing]
    end

    subgraph Challenge System
        CS1[Main Open Challenge<br>7 Days]
        CS2[Public Time-Limited<br>4-24h]
        CS3[Private Challenge<br>4-24h]
    end

    subgraph Artwork System
        AS1[Submission<br>99 SLN + fee]
        AS2[Content Storage]
        AS3[Ordinal Creation]
    end

    subgraph Vote Packs
        VP1[Basic 10×1 SLN]
        VP2[Art Lover 100×1 SLN]
        VP3[Pro 10×2 SLN]
        VP4[Expert 10×5 SLN]
        VP5[Elite 10×10 SLN]
    end

    subgraph Voting Arena
        VA1[Pair Generation]
        VA2[Vote Casting]
        VA3[Result Processing]
    end

    subgraph Leaderboards
        LB1[Challenge Rankings]
        LB2[Artist Rankings]
        LB3[Curator Rankings]
    end

    subgraph Reward Pool
        RP1[Main Pool]
        RP2[Artist Pool]
        RP3[Development]
        RP4[Top Voters]
    end

    %% Core Interactions
    UM2 & UM3 --> AS1
    AS1 --> CS1 & CS2 & CS3
    UM2 & UM3 --> VP1 & VP2 & VP3 & VP4 & VP5
    VP1 & VP2 & VP3 & VP4 & VP5 --> VA2
    VA2 --> LB1 & LB2 & LB3
    CS1 & CS2 & CS3 --> RP1 & RP2
    TS1 --> RP1 & RP2 & RP3 & RP4
```

## Core Systems Overview

### 1. User Management
- Guest: View only
- User: Basic participation
- Member: Premium features
- Moderator: Content control
- Admin: Full control

### 2. Token System
- SLN Token (1 cent USD)
- Market fee (2.18% rounded up)
- Transaction processing
- Wallet integration

### 3. Challenge System
- Main Open Challenge (7 days)
- Public Time-Limited (4-24h)
- Private Challenge (4-24h)
- Entry requirements
- Reward structures

### 4. Artwork Submission
- Submission fee: 99 SLN + 3
- Content validation
- Ordinal creation
- Challenge assignment

### 5. Vote Packs
- Basic: 10×1 SLN votes
- Art Lover: 100×1 SLN votes
- Pro: 10×2 SLN votes
- Expert: 10×5 SLN votes
- Elite: 10×10 SLN votes

### 6. Voting Arena
- Pair presentation
- Vote casting
- Weight application
- Result calculation

### 7. Leaderboards
- Challenge rankings
- Artist rankings
- Curator rankings
- Performance metrics

### 8. Reward Pool
- Main reward pool
- Artist distribution
- Development fund
- Top voter rewards

## Key System Interactions

```mermaid
sequenceDiagram
    participant User
    participant Challenge
    participant Voting
    participant Rewards

    User->>Challenge: Enter Challenge
    User->>Voting: Cast Votes
    Voting->>Challenge: Update Rankings
    Challenge->>Rewards: Distribute Value
    Rewards->>User: Send Rewards
```

## Value Flow

```mermaid
flowchart TB
    subgraph Input
        I1[Submission Fees]
        I2[Vote Pack Sales]
        I3[Premium Members]
        I4[Challenge Fees]
    end

    subgraph Processing
        P1[Market Fees]
        P2[Value Distribution]
        P3[Reward Calculation]
    end

    subgraph Output
        O1[Artist Rewards]
        O2[Curator Rewards]
        O3[Development]
    end

    I1 & I2 & I3 & I4 --> P1 & P2
    P2 --> P3
    P3 --> O1 & O2 & O3
```

Would you like me to:
1. Detail any specific component?
2. Show more interaction flows?
3. Explain value distribution?
4. Add any missing features?

The system integrates all components through the challenge and voting mechanics, with the token system providing the economic backbone.