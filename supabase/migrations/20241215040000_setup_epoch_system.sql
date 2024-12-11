-- Setup complete epoch system

-- Create epochs table
CREATE TABLE IF NOT EXISTS epochs (
    id BIGSERIAL PRIMARY KEY,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'processing', 'completed')),
    total_votes BIGINT NOT NULL DEFAULT 0,
    total_rewards BIGINT NOT NULL DEFAULT 0,
    participating_artworks INTEGER NOT NULL DEFAULT 0,
    unique_voters INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for epochs table
ALTER TABLE epochs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to epochs"
    ON epochs FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow admin full access to epochs"
    ON epochs FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Enable RLS on epochs
ALTER TABLE public.epochs ENABLE ROW LEVEL SECURITY;

-- Add epoch support to votes table
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS epoch_id bigint;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS processed boolean DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_epochs_status_end_time ON epochs(status, end_time);
CREATE INDEX IF NOT EXISTS idx_votes_processed_epoch_id ON votes(processed, epoch_id);
CREATE INDEX IF NOT EXISTS votes_epoch_id_idx ON public.votes(epoch_id);

-- Add foreign key constraint
ALTER TABLE public.votes 
    ADD CONSTRAINT votes_epoch_id_fkey 
    FOREIGN KEY (epoch_id) 
    REFERENCES public.epochs(id);

-- Create epoch processing functions
CREATE OR REPLACE FUNCTION process_epoch_votes(epoch_id_param bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_votes bigint;
    vote_value numeric;
    epoch_total_tokens numeric;
BEGIN
    -- Get total votes in the epoch
    SELECT COUNT(*) INTO total_votes 
    FROM votes 
    WHERE epoch_id = epoch_id_param 
    AND processed = false;

    -- If no votes, exit
    IF total_votes = 0 THEN
        RETURN;
    END IF;

    -- Get total tokens to distribute for this epoch
    SELECT tokens_per_epoch INTO epoch_total_tokens 
    FROM epochs 
    WHERE id = epoch_id_param;

    -- Calculate value per vote
    vote_value := epoch_total_tokens / total_votes;

    -- Process each unprocessed vote
    WITH vote_processing AS (
        SELECT 
            v.id as vote_id,
            v.artwork_id,
            v.user_id,
            vote_value as token_amount
        FROM votes v
        WHERE v.epoch_id = epoch_id_param
        AND v.processed = false
    ),
    token_distribution AS (
        -- Insert tokens for artwork creators
        INSERT INTO tokens (user_id, artwork_id, amount, source, epoch_id)
        SELECT 
            a.user_id,
            vp.artwork_id,
            vp.token_amount,
            'vote_reward',
            epoch_id_param
        FROM vote_processing vp
        JOIN artworks a ON a.id = vp.artwork_id
        RETURNING 1
    )
    -- Mark votes as processed
    UPDATE votes v
    SET processed = true
    FROM vote_processing vp
    WHERE v.id = vp.vote_id;

    -- Update artwork vault values
    UPDATE artworks a
    SET vault_value = (
        SELECT COALESCE(SUM(amount), 0)
        FROM tokens t
        WHERE t.artwork_id = a.id
    )
    WHERE EXISTS (
        SELECT 1 
        FROM votes v 
        WHERE v.artwork_id = a.id 
        AND v.epoch_id = epoch_id_param
    );
END;
$$;

-- Create function to process completed epochs
CREATE OR REPLACE FUNCTION process_completed_epochs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    epoch_record RECORD;
BEGIN
    -- Find completed but unprocessed epochs
    FOR epoch_record IN 
        SELECT id 
        FROM epochs 
        WHERE end_time <= NOW() 
        AND status = 'active'
        ORDER BY end_time ASC
    LOOP
        -- Process votes for the epoch
        PERFORM process_epoch_votes(epoch_record.id);
        
        -- Mark epoch as completed
        UPDATE epochs 
        SET status = 'completed',
            processed_at = NOW()
        WHERE id = epoch_record.id;
        
        -- Create next epoch if it doesn't exist
        INSERT INTO epochs (start_time, end_time, tokens_per_epoch, status)
        SELECT
            end_time, -- Previous epoch's end time is new epoch's start time
            end_time + INTERVAL '24 hours',
            tokens_per_epoch, -- Keep same token allocation
            'active'
        FROM epochs
        WHERE id = epoch_record.id
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$;

-- Create function to get current epoch
CREATE OR REPLACE FUNCTION get_current_epoch()
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
    SELECT id 
    FROM epochs 
    WHERE start_time <= NOW() 
    AND end_time > NOW() 
    ORDER BY start_time DESC 
    LIMIT 1;
$$;

-- Create function to check if user has voted in current epoch
CREATE OR REPLACE FUNCTION has_voted_in_current_epoch(artwork_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM votes v
        WHERE v.artwork_id = artwork_id_param
        AND v.user_id = auth.uid()
        AND v.epoch_id = get_current_epoch()
    );
$$;

-- Create function to get epoch statistics
CREATE OR REPLACE FUNCTION get_epoch_stats(epoch_id_param bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    WITH vote_stats AS (
        SELECT
            COUNT(DISTINCT v.user_id) as unique_voters,
            COUNT(DISTINCT v.artwork_id) as participating_artworks,
            COALESCE(SUM(v.value), 0) as total_votes,
            MAX(v.value) as highest_vote,
            MIN(v.value) as lowest_vote,
            COALESCE(AVG(v.value), 0) as avg_vote_size
        FROM votes v
        WHERE v.epoch_id = epoch_id_param
    ),
    token_stats AS (
        SELECT
            COALESCE(SUM(t.amount), 0) as total_tokens_distributed,
            COUNT(DISTINCT t.user_id) as rewarded_artists,
            MAX(t.amount) as highest_reward,
            MIN(t.amount) as lowest_reward,
            COALESCE(AVG(t.amount), 0) as avg_reward
        FROM tokens t
        WHERE t.epoch_id = epoch_id_param
        AND t.source = 'vote_reward'
    ),
    artwork_stats AS (
        SELECT
            COUNT(*) FILTER (WHERE v.value > 0) as artworks_with_votes,
            COALESCE(AVG(vote_count), 0) as avg_votes_per_artwork,
            MAX(vote_count) as most_votes_artwork,
            MIN(vote_count) as least_votes_artwork
        FROM (
            SELECT 
                artwork_id,
                COUNT(*) as vote_count
            FROM votes v
            WHERE v.epoch_id = epoch_id_param
            GROUP BY artwork_id
        ) v
    )
    SELECT json_build_object(
        'total_votes', vs.total_votes,
        'unique_voters', vs.unique_voters,
        'participating_artworks', vs.participating_artworks,
        'highest_vote', vs.highest_vote,
        'lowest_vote', vs.lowest_vote,
        'avg_vote_size', ROUND(vs.avg_vote_size::numeric, 2),
        'total_tokens_distributed', ts.total_tokens_distributed,
        'rewarded_artists', ts.rewarded_artists,
        'highest_reward', ts.highest_reward,
        'lowest_reward', ts.lowest_reward,
        'avg_reward', ROUND(ts.avg_reward::numeric, 2),
        'artworks_with_votes', ast.artworks_with_votes,
        'avg_votes_per_artwork', ROUND(ast.avg_votes_per_artwork::numeric, 2),
        'most_votes_artwork', ast.most_votes_artwork,
        'least_votes_artwork', ast.least_votes_artwork,
        'completion_percentage', (
            SELECT
                CASE
                    WHEN end_time > NOW() THEN 
                        ROUND(
                            (EXTRACT(EPOCH FROM (NOW() - start_time)) /
                            EXTRACT(EPOCH FROM (end_time - start_time)) * 100)::numeric,
                            2
                        )
                    ELSE 100
                END
            FROM epochs
            WHERE id = epoch_id_param
        )
    ) INTO result
    FROM vote_stats vs
    CROSS JOIN token_stats ts
    CROSS JOIN artwork_stats ast;

    RETURN result;
END;
$$;

-- Create function to get token volume history
CREATE OR REPLACE FUNCTION get_token_volume_history(num_epochs int DEFAULT 10)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    WITH epoch_volumes AS (
        SELECT 
            e.id as epoch_id,
            e.start_time,
            e.end_time,
            COALESCE(SUM(t.amount), 0) as token_volume,
            COUNT(DISTINCT t.user_id) as unique_recipients,
            e.tokens_per_epoch as total_available
        FROM epochs e
        LEFT JOIN tokens t ON t.epoch_id = e.id AND t.source = 'vote_reward'
        WHERE e.status = 'completed'
        GROUP BY e.id, e.start_time, e.end_time, e.tokens_per_epoch
        ORDER BY e.start_time DESC
        LIMIT num_epochs
    )
    SELECT json_agg(
        json_build_object(
            'epoch_id', epoch_id,
            'start_time', start_time,
            'end_time', end_time,
            'token_volume', token_volume,
            'unique_recipients', unique_recipients,
            'total_available', total_available,
            'distribution_rate', CASE 
                WHEN total_available > 0 
                THEN ROUND((token_volume::numeric / total_available::numeric * 100), 2)
                ELSE 0
            END
        )
        ORDER BY start_time ASC
    ) INTO result
    FROM epoch_volumes;

    RETURN result;
END;
$$;

-- Create trigger to set epoch_id on new votes
CREATE OR REPLACE FUNCTION set_vote_epoch()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.epoch_id := get_current_epoch();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_vote_epoch_trigger
    BEFORE INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION set_vote_epoch();

-- Schedule epoch processing
SELECT cron.schedule(
    'process-epochs',
    '*/10 * * * *', -- Run every 10 minutes
    $$
    SELECT process_completed_epochs();
    $$
);

-- Create function to initialize first epoch
CREATE OR REPLACE FUNCTION initialize_first_epoch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO epochs (
        start_time,
        end_time,
        status,
        total_votes,
        total_rewards,
        participating_artworks,
        unique_voters
    )
    VALUES (
        NOW(),
        NOW() + INTERVAL '7 days',
        'active',
        0,
        0,
        0,
        0
    );
END;
$$;

-- Initialize first epoch
SELECT initialize_first_epoch(); 