# Meta.Salon System Documentation
## Part 1: System Overview

## 1. Core Components

```mermaid
graph TB
    subgraph Core Platform
        UM[User Management]
        TS[Token System]
        VS[Vault System]
        CS[Challenge System]
        VG[Voting Game]
        RS[Reward System]
    end

    subgraph User Layer
        U1[Guest]
        U2[User]
        U3[Member]
        U4[Moderator]
        U5[Admin]
    end

    subgraph Token Layer
        T1[SLN Token]
        T2[Vote Packs]
        T3[Rewards]
        T4[Market Fees]
    end

    subgraph Value Flow
        V1[Main Vault]
        V2[User Grants]
        V3[Revenue Collection]
        V4[Reward Distribution]
    end

    U1 & U2 & U3 & U4 & U5 --> UM
    TS --> T1 & T2 & T3 & T4
    V1 & V2 & V3 & V4 --> VS
```

## 2. User Roles & Permissions

### 2.1 Role Hierarchy
```plaintext
1. Guest (Not Logged In)
   - View public content
   - Browse artworks
   - View leaderboards

2. User (Logged In)
   - Submit artworks (99 SLN + 3)
   - Purchase vote packs
   - Participate in challenges
   - Initial grant: 209 SLN (199 + 10 basic pack)

3. Member (Premium)
   - All user capabilities
   - Reduced fees
   - Premium features
   - Monthly fee: 999 SLN + 22

4. Moderator
   - Content moderation
   - Challenge management
   - User reports
   - System monitoring

5. Admin
   - Full system control
   - Economic management
   - User management
   - Platform configuration
```

## 3. Token Economics

### 3.1 Token Structure
```mermaid
flowchart TB
    subgraph Token System
        T1[SLN Token<br>1 SLN = $0.01]
        T2[Market Fee 2.18%]
    end

    subgraph Vote Packs
        VP1[Basic: 10×1 SLN]
        VP2[Art Lover: 100×1 SLN]
        VP3[Pro: 10×2 SLN]
        VP4[Expert: 10×5 SLN]
        VP5[Elite: 10×10 SLN]
    end

    subgraph Main Vault
        MV1[Initial: 100.000 SLN]
        MV2[Reserve: 20.000 SLN]
        MV3[User Acquisition: 209 SLN/user]
    end
```

### 3.2 Value Flow
```mermaid
flowchart TB
    subgraph Revenue Sources
        R1[Artwork Submissions]
        R2[Vote Pack Sales]
        R3[Premium Memberships]
        R4[Private Challenges]
    end

    subgraph Distribution
        D1[Main Pool]
        D2[Artist Pool]
        D3[Development]
        D4[Top Voters]
    end

    R1 & R2 & R3 & R4 --> MainVault
    MainVault --> D1 & D2 & D3 & D4
```

## 4. Challenge System

### 4.1 Challenge Types
```plaintext
1. Main Open Challenge
   - 7-day duration
   - Entry: 99 SLN + 3
   - 100% to reward pool
   - Weekly distribution

2. Public Time-Limited
   - 4-24 hours
   - Free entry
   - Public reward pool
   - Community-driven

3. Private Challenge
   - 4-24 hours
   - Setup: 299 SLN + 7
   - Custom vote packs
   - Invite-only
```

### 4.2 Challenge Flow
```mermaid
stateDiagram-v2
    [*] --> Created
    Created --> Active
    Active --> Voting
    Voting --> Calculating
    Calculating --> Distributing
    Distributing --> Completed

    state Active {
        [*] --> AcceptingSubmissions
        AcceptingSubmissions --> ValidationCheck
        ValidationCheck --> Accepted
        ValidationCheck --> Rejected
    }

    state Voting {
        [*] --> PairPresentation
        PairPresentation --> VoteCollection
        VoteCollection --> ResultTracking
    }
```

## 5. System Architecture

### 5.1 Technical Stack
```plaintext
1. Frontend
   - React Native
   - State Management: Redux
   - UI: Chakra UI
   - Animations: Framer Motion

2. Blockchain
   - BSV Chain
   - 1sat Ordinals
   - Yours Wallet
   - GorillaPool API

3. Backend
   - Node.js
   - Database: PostgreSQL
   - Caching: Redis
   - Message Queue: RabbitMQ
```

### 5.2 Integration Points
```mermaid
graph TB
    subgraph Frontend
        UI[User Interface]
        State[State Management]
        Wallet[Wallet Integration]
    end

    subgraph Backend
        API[API Gateway]
        Services[Core Services]
        Cache[Cache Layer]
    end

    subgraph Blockchain
        BSV[BSV Chain]
        Ordinals[1sat Ordinals]
        Pool[GorillaPool]
    end

    Frontend --> Backend
    Backend --> Blockchain
```

Would you like me to:
1. Proceed with Part 2: Platform Mechanics?
2. Detail any specific component?
3. Show more integration patterns?
4. Expand any section?

This first part provides the foundation for understanding Meta.Salon's structure. The next parts will detail specific mechanics and implementation.