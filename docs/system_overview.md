# Meta Salon System Overview

## Current System State

### Authentication & Users
- User registration and authentication via Supabase
- Role-based access control (admin, user)
- User profiles with token balances

### Token System
- Initial token grant on signup
- Vote pack purchases
- Transaction tracking for all token movements
- Token types: SLN (platform token)

### Artwork System
- Two-step submission process:
  1. Upload artwork (draft state)
  2. Submit to challenge
- Storage integration with Supabase
- Album organization
- Metadata tracking

### Challenge System
- Challenge types: open, public, private
- Status tracking: draft, active, completed, cancelled
- Submission fee handling
- Admin-only challenge creation

## Digital Vault Concept

Artworks in Meta Salon function as digital vaults that:
1. Consume votes they receive
2. Accumulate value over time
3. Act as value storage mechanisms
4. Generate rewards based on voting performance

## Missing Components

### 1. Vote Infrastructure
- Vote tracking table
- Vote pack usage system
- Vote-to-value conversion mechanism
- Vote consumption tracking

### 2. Vault Mechanics
- Value accumulation formulas
- Vote consumption rules
- Vault state tracking
- Value distribution mechanisms

### 3. Reward System
- Challenge reward pools
- Vote-based reward calculation
- Reward distribution timing
- Winner selection mechanisms

## Implementation Roadmap

### Phase 1: Vote Infrastructure
1. Create votes table
   - Track vote source (user)
   - Track target (artwork)
   - Record timestamp and value
   - Track vote pack usage

2. Implement vote pack system
   - Vote pack activation
   - Vote allocation tracking
   - Vote usage limitations

### Phase 2: Vault Mechanics
1. Extend artwork table
   - Add vault-specific fields
   - Track accumulated value
   - Store vote consumption data

2. Create vault functions
   - Vote consumption calculation
   - Value accumulation formulas
   - State transition handlers

### Phase 3: Reward System
1. Challenge enhancements
   - Add reward pool tracking
   - Define reward distribution rules
   - Implement winner selection

2. Distribution mechanics
   - Create reward calculation functions
   - Implement automated distribution
   - Add reward claim system

## Database Schema Updates Needed

### New Tables
```sql
-- Votes table
create table public.votes (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    artwork_id uuid references public.artworks(id) not null,
    pack_id uuid references public.vote_packs(id) not null,
    value integer not null,
    consumed boolean default false,
    created_at timestamptz default now()
);

-- Vault states table
create table public.vault_states (
    artwork_id uuid references public.artworks(id) primary key,
    accumulated_value integer default 0,
    total_votes integer default 0,
    last_vote_at timestamptz,
    updated_at timestamptz default now()
);

-- Reward pools table
create table public.reward_pools (
    challenge_id uuid references public.challenges(id) primary key,
    total_amount integer default 0,
    distributed boolean default false,
    distribution_time timestamptz,
    created_at timestamptz default now()
);
```

### Table Modifications
```sql
-- Add vault fields to artworks
alter table public.artworks add column if not exists vault_status text 
    check (vault_status in ('active', 'locked', 'distributed'));
alter table public.artworks add column if not exists vote_count integer default 0;
alter table public.artworks add column if not exists vault_value integer default 0;

-- Add reward fields to challenges
alter table public.challenges add column if not exists reward_pool integer default 0;
alter table public.challenges add column if not exists reward_distribution_type text
    check (reward_distribution_type in ('top_n', 'proportional', 'threshold'));
```

## Next Steps

1. Implement vote infrastructure
   - Create database tables
   - Build vote submission API
   - Implement vote pack usage tracking

2. Build vault mechanics
   - Implement value accumulation
   - Create vote consumption rules
   - Build state management

3. Develop reward system
   - Create reward pools
   - Implement distribution logic
   - Build winner selection

4. Create UI components
   - Voting interface
   - Vault status display
   - Reward tracking
   - Winner announcement 