-- Enable pg_net extension for HTTP requests in cron jobs
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any existing cron jobs for drip campaigns to avoid duplicates
SELECT cron.unschedule('process-drip-campaigns');

-- Create the cron job to run every 5 minutes
SELECT cron.schedule(
  'process-drip-campaigns',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://mpzqlidtvlbijloeusuj.supabase.co/functions/v1/process-drip-campaigns',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wenFsaWR0dmxiaWpsb2V1c3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU0NzksImV4cCI6MjA2NjY0MTQ3OX0.BN01gE1yW8sIsWE7UMykMxYTOHzb2gZ5A2mFaB219YU"}'::jsonb,
      body := '{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Trigger an immediate run to process pending emails
SELECT
  net.http_post(
    url := 'https://mpzqlidtvlbijloeusuj.supabase.co/functions/v1/process-drip-campaigns',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wenFsaWR0dmxiaWpsb2V1c3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU0NzksImV4cCI6MjA2NjY0MTQ3OX0.BN01gE1yW8sIsWE7UMykMxYTOHzb2gZ5A2mFaB219YU"}'::jsonb,
    body := '{"trigger": "manual"}'::jsonb
  ) as immediate_request;