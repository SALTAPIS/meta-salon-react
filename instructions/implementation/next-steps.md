# Meta Salon: Next Implementation Steps

## 1. Token Distribution System

### Database Schema Updates
```sql
-- Artist payouts table
CREATE TABLE public.artist_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES auth.users(id),
    artwork_id UUID REFERENCES public.artworks(id),
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    transaction_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Transaction history enhancement
ALTER TABLE public.transactions
ADD COLUMN payout_id UUID REFERENCES public.artist_payouts(id),
ADD COLUMN metadata JSONB;
```

### Database Functions
```sql
-- Function to calculate available payout
CREATE OR REPLACE FUNCTION calculate_artist_payout(p_artwork_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_available_amount NUMERIC;
BEGIN
    SELECT vault_value - COALESCE(
        (SELECT SUM(amount) FROM artist_payouts 
         WHERE artwork_id = p_artwork_id 
         AND status != 'failed'),
        0
    )
    INTO v_available_amount
    FROM artworks
    WHERE id = p_artwork_id;
    
    RETURN v_available_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request payout
CREATE OR REPLACE FUNCTION request_artist_payout(
    p_artwork_id UUID,
    p_amount NUMERIC
) RETURNS UUID AS $$
DECLARE
    v_payout_id UUID;
    v_available_amount NUMERIC;
BEGIN
    -- Calculate available amount
    v_available_amount := calculate_artist_payout(p_artwork_id);
    
    IF v_available_amount < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds. Available: %, Requested: %', 
            v_available_amount, p_amount;
    END IF;
    
    -- Create payout record
    INSERT INTO artist_payouts (
        artist_id,
        artwork_id,
        amount,
        status
    )
    VALUES (
        auth.uid(),
        p_artwork_id,
        p_amount,
        'pending'
    )
    RETURNING id INTO v_payout_id;
    
    RETURN v_payout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### API Implementation

#### Artist Service
```typescript
interface ArtistPayout {
  id: string;
  artwork_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
}

class ArtistService {
  static async getAvailablePayout(artworkId: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_artist_payout', { p_artwork_id: artworkId });
    if (error) throw error;
    return data;
  }

  static async requestPayout(artworkId: string, amount: number): Promise<string> {
    const { data, error } = await supabase
      .rpc('request_artist_payout', {
        p_artwork_id: artworkId,
        p_amount: amount
      });
    if (error) throw error;
    return data;
  }

  static async getPayoutHistory(): Promise<ArtistPayout[]> {
    const { data, error } = await supabase
      .from('artist_payouts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
}
```

## 2. Artist Dashboard

### Components Structure
```typescript
// Pages
src/
  pages/
    artist/
      DashboardPage.tsx       // Main artist dashboard
      PayoutPage.tsx          // Payout management
      ArtworkStatsPage.tsx    // Detailed artwork statistics
      
  components/
    artist/
      PayoutRequest.tsx       // Payout request form
      VaultStats.tsx          // Vault statistics display
      EarningsChart.tsx       // Earnings visualization
      PayoutHistory.tsx       // Transaction history
```

### Dashboard Features
1. **Vault Overview**
   - Total SLN accumulated
   - USD equivalent
   - Recent votes
   - Payout availability

2. **Artwork Performance**
   - Vote count trends
   - Token accumulation rate
   - Voter demographics
   - Comparison charts

3. **Payout Management**
   - Request payout form
   - Payment history
   - Transaction status
   - Automated notifications

## 3. Analytics Implementation

### Database Views
```sql
-- Artwork performance view
CREATE VIEW artwork_analytics AS
SELECT 
    a.id,
    a.title,
    a.user_id as artist_id,
    a.vote_count,
    a.vault_value as sln_balance,
    COUNT(DISTINCT v.user_id) as unique_voters,
    AVG(v.value * v.vote_power) as avg_vote_value,
    MAX(v.created_at) as last_vote_at
FROM artworks a
LEFT JOIN votes v ON v.artwork_id = a.id
GROUP BY a.id;

-- Artist earnings view
CREATE VIEW artist_earnings AS
SELECT 
    u.id as artist_id,
    COUNT(a.id) as artwork_count,
    SUM(a.vault_value) as total_sln_earned,
    SUM(p.amount) as total_sln_paid
FROM auth.users u
LEFT JOIN artworks a ON a.user_id = u.id
LEFT JOIN artist_payouts p ON p.artist_id = u.id
GROUP BY u.id;
```

### Analytics Service
```typescript
interface ArtworkAnalytics {
  id: string;
  title: string;
  vote_count: number;
  sln_balance: number;
  unique_voters: number;
  avg_vote_value: number;
  last_vote_at: string;
}

class AnalyticsService {
  static async getArtworkAnalytics(artworkId: string): Promise<ArtworkAnalytics> {
    const { data, error } = await supabase
      .from('artwork_analytics')
      .select('*')
      .eq('id', artworkId)
      .single();
    if (error) throw error;
    return data;
  }

  static async getArtistEarnings(): Promise<{
    artwork_count: number;
    total_sln_earned: number;
    total_sln_paid: number;
  }> {
    const { data, error } = await supabase
      .from('artist_earnings')
      .select('*')
      .eq('artist_id', auth.user()?.id)
      .single();
    if (error) throw error;
    return data;
  }
}
```

## 4. Implementation Timeline

### Phase 1: Token Distribution (Week 1-2)
1. Database schema updates
2. Payout functions implementation
3. Basic API integration
4. Testing and validation

### Phase 2: Artist Dashboard (Week 3-4)
1. Dashboard UI components
2. Payout request flow
3. Transaction history
4. Real-time updates

### Phase 3: Analytics (Week 5-6)
1. Database views creation
2. Analytics service implementation
3. Dashboard integration
4. Performance optimization

## 5. Testing Strategy

### Unit Tests
```typescript
describe('ArtistService', () => {
  it('should calculate available payout correctly', async () => {
    const amount = await ArtistService.getAvailablePayout(artworkId);
    expect(amount).toBeGreaterThanOrEqual(0);
  });

  it('should prevent excessive payout requests', async () => {
    await expect(
      ArtistService.requestPayout(artworkId, 999999)
    ).rejects.toThrow('Insufficient funds');
  });
});
```

### Integration Tests
1. Complete payout flow
2. Real-time updates
3. Analytics accuracy
4. Error handling

### Performance Tests
1. Large dataset handling
2. Concurrent request handling
3. Real-time update efficiency 