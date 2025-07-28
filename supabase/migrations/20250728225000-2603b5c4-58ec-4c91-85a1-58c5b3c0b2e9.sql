-- Create the missing profile for the existing user
INSERT INTO public.profiles (
  id, 
  business_name, 
  full_name,
  store_handle,
  trial_ends_at,
  has_active_subscription,
  created_at,
  updated_at
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'business_name', 'My Business'),
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  'store' || EXTRACT(epoch from now())::TEXT, -- Unique handle
  now() + interval '7 days',
  false,
  now(),
  now()
FROM auth.users u
WHERE u.email = 'johnrosspersonal@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);

-- Also create the trial start transaction
INSERT INTO public.subscription_transactions (
  user_id,
  transaction_type,
  status,
  reference,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'trial_start',
  'completed',
  'Free trial started',
  now(),
  now()
FROM auth.users u
WHERE u.email = 'johnrosspersonal@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM subscription_transactions st 
    WHERE st.user_id = u.id AND st.transaction_type = 'trial_start'
  );