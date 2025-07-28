-- Delete all users and their associated data
-- This will use the existing cascade function to ensure proper cleanup

DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through all users and delete them using the cascade function
    FOR user_record IN SELECT id FROM auth.users LOOP
        PERFORM public.delete_user_completely(user_record.id);
        RAISE NOTICE 'Deleted user: %', user_record.id;
    END LOOP;
    
    RAISE NOTICE 'All users have been deleted successfully';
END $$;