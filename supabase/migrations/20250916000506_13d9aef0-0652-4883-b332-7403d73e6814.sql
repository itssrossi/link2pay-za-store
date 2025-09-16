-- Set up cron job to process drip campaigns every hour
SELECT cron.schedule(
  'process-drip-campaigns',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://mpzqlidtvlbijloeusuj.supabase.co/functions/v1/process-drip-campaigns',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wenFsaWR0dmxiaWpsb2V1c3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU0NzksImV4cCI6MjA2NjY0MTQ3OX0.BN01gE1yW8sIsWE7UMykMxYTOHzb2gZ5A2mFaB219YU"}'::jsonb,
      body := '{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);