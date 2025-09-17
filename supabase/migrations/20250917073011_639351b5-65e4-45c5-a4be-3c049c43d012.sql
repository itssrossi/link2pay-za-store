-- Create cron job to process WhatsApp campaigns every 5 minutes
SELECT cron.schedule(
  'process-whatsapp-campaigns',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://mpzqlidtvlbijloeusuj.supabase.co/functions/v1/process-whatsapp-campaigns',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wenFsaWR0dmxiaWpsb2V1c3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU0NzksImV4cCI6MjA2NjY0MTQ3OX0.BN01gE1yW8sIsWE7UMykMxYTOHzb2gZ5A2mFaB219YU"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);