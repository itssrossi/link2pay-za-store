import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://mpzqlidtvlbijloeusuj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wenFsaWR0dmxiaWpsb2V1c3VqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA2NTQ3OSwiZXhwIjoyMDY2NjQxNDc5fQ.xz1YlZA_iE4Gn8AKF8vLjhgzGHHDQx5YFXQ2qrnz37g";

// Admin client with service role key - bypasses RLS
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);