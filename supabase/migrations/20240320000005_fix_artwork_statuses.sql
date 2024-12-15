-- Check current artwork status distribution
DO $$
DECLARE
    v_submitted_count INTEGER;
    v_approved_count INTEGER;
    v_rejected_count INTEGER;
    v_draft_count INTEGER;
BEGIN
    -- Get counts for each status
    SELECT COUNT(*) INTO v_submitted_count
    FROM public.artworks
    WHERE status = 'submitted';

    SELECT COUNT(*) INTO v_approved_count
    FROM public.artworks
    WHERE status = 'approved';

    SELECT COUNT(*) INTO v_rejected_count
    FROM public.artworks
    WHERE status = 'rejected';

    SELECT COUNT(*) INTO v_draft_count
    FROM public.artworks
    WHERE status = 'draft';

    -- Log the current distribution
    RAISE NOTICE 'Current artwork status distribution:';
    RAISE NOTICE 'Submitted: %, Approved: %, Rejected: %, Draft: %',
        v_submitted_count, v_approved_count, v_rejected_count, v_draft_count;

    -- If we have no submitted or approved artworks, update draft artworks to submitted
    IF (v_submitted_count + v_approved_count) = 0 AND v_draft_count > 0 THEN
        UPDATE public.artworks
        SET status = 'submitted'
        WHERE status = 'draft';
        
        RAISE NOTICE 'Updated % draft artworks to submitted status', v_draft_count;
    END IF;
END $$;

-- Ensure all non-rejected artworks have active vault status
UPDATE public.artworks
SET vault_status = 'active'
WHERE status != 'rejected'
AND (vault_status IS NULL OR vault_status != 'active');

-- Add constraint to ensure valid status values if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'artworks_status_check'
    ) THEN
        ALTER TABLE public.artworks
        ADD CONSTRAINT artworks_status_check
        CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));
    END IF;
END $$; 