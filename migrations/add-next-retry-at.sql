-- Migration: Add nextRetryAt column for retry scheduling
-- Description: Adds nextRetryAt timestamp field to track when failed notifications should be retried
-- Date: 2025-11-03

-- Add the nextRetryAt column
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP NULL;

-- Add index for efficient queue processing
-- This index helps the queue processor quickly find notifications ready for retry
CREATE INDEX IF NOT EXISTS idx_notifications_retry_queue 
ON notifications(status, "nextRetryAt") 
WHERE status = 'pending';

-- Add index for monitoring failed notifications
CREATE INDEX IF NOT EXISTS idx_notifications_failed 
ON notifications(status, "retryCount") 
WHERE status = 'failed';

-- Add comment to document the column purpose
COMMENT ON COLUMN notifications."nextRetryAt" IS 'Timestamp when the notification should be retried (for exponential backoff)';

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'nextRetryAt';

-- Show index information
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'notifications' 
AND (indexname LIKE '%retry%' OR indexname LIKE '%failed%');

