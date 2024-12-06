-- Check trigger logs for recent activity
SELECT 
    trigger_name,
    operation,
    created_at,
    old_data->>'balance' as old_balance,
    new_data->>'balance' as new_balance,
    new_data->>'channel' as channel,
    new_data->>'payload' as payload
FROM public.trigger_logs
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC
LIMIT 10; 