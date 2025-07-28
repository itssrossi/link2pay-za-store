-- First, let's see what users exist and their email confirmation status
-- Then we'll fix the email confirmation issue

-- Check current user status
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'johnrosspersonal@gmail.com'
ORDER BY created_at DESC
LIMIT 5;