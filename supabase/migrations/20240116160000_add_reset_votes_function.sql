-- Create function to reset all votes and vault values
CREATE OR REPLACE FUNCTION admin_reset_all_votes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_votes INTEGER;
    v_updated_artworks INTEGER;
BEGIN
    -- Delete all votes
    WITH deleted AS (
        DELETE FROM public.votes
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_votes FROM deleted;

    -- Reset all artwork vote counts and vault values
    WITH updated AS (
        UPDATE public.artworks
        SET 
            vote_count = 0,
            vault_value = 0,
            updated_at = now()
        WHERE status = 'submitted'
        RETURNING *
    )
    SELECT COUNT(*) INTO v_updated_artworks FROM updated;

    -- Return summary
    RETURN jsonb_build_object(
        'success', true,
        'deleted_votes', v_deleted_votes,
        'updated_artworks', v_updated_artworks
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_reset_all_votes() TO authenticated; 