
-- Update the delete_user_completely function to properly handle auth user deletion
CREATE OR REPLACE FUNCTION delete_user_completely(p_uid uuid)
RETURNS void AS $$
DECLARE
  invoice_ids uuid[];
BEGIN
  -- Get all invoice IDs for this user first
  SELECT ARRAY(SELECT id FROM invoices WHERE user_id = p_uid) INTO invoice_ids;
  
  -- Delete in correct order to avoid foreign key constraints
  -- 1. Delete invoice items and reminders first (they reference invoices)
  IF array_length(invoice_ids, 1) > 0 THEN
    DELETE FROM invoice_items WHERE invoice_id = ANY(invoice_ids);
    DELETE FROM invoice_reminders WHERE invoice_id = ANY(invoice_ids);
  END IF;
  
  -- 2. Delete user-owned data
  DELETE FROM products WHERE user_id = p_uid;
  DELETE FROM invoices WHERE user_id = p_uid;
  DELETE FROM store_sections WHERE user_id = p_uid;
  DELETE FROM subscription_transactions WHERE user_id = p_uid;
  DELETE FROM profiles WHERE id = p_uid;
  
  -- 3. Delete from auth.users table (requires security definer)
  DELETE FROM auth.users WHERE id = p_uid;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE NOTICE 'Error deleting user %: %', p_uid, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION delete_user_completely(uuid) TO authenticated;
