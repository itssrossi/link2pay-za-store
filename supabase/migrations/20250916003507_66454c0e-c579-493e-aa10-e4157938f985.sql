-- Update the existing cron job to run every 5 minutes instead of every hour
SELECT cron.alter_job(
  'process-drip-campaigns',
  schedule := '*/5 * * * *'  -- Every 5 minutes
);