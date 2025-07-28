-- Check if there are any issues with the user's profile
SELECT p.*, u.email_confirmed_at 
FROM profiles p
RIGHT JOIN auth.users u ON p.id = u.id
WHERE u.email = 'johnrosspersonal@gmail.com';

-- Also check if there are multiple users with same email
SELECT COUNT(*), email FROM auth.users 
WHERE email = 'johnrosspersonal@gmail.com'
GROUP BY email;