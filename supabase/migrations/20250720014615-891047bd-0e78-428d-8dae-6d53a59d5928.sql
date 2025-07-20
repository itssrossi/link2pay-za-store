-- Create function to completely delete a user account and all associated data
CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete in correct order to avoid foreign key constraints
  
  -- 1. Get all invoice IDs for this user
  DECLARE
    invoice_ids UUID[];
  BEGIN
    SELECT ARRAY(SELECT id FROM invoices WHERE invoices.user_id = delete_user_account.user_id) INTO invoice_ids;
    
    -- 2. Delete invoice items and reminders first (they reference invoices)
    IF array_length(invoice_ids, 1) > 0 THEN
      DELETE FROM invoice_items WHERE invoice_id = ANY(invoice_ids);
      DELETE FROM invoice_reminders WHERE invoice_id = ANY(invoice_ids);
    END IF;
    
    -- 3. Delete user-owned data
    DELETE FROM products WHERE products.user_id = delete_user_account.user_id;
    DELETE FROM invoices WHERE invoices.user_id = delete_user_account.user_id;
    DELETE FROM store_sections WHERE store_sections.user_id = delete_user_account.user_id;
    DELETE FROM subscription_transactions WHERE subscription_transactions.user_id = delete_user_account.user_id;
    
    -- 4. Delete profile (this will cascade delete the auth user due to foreign key)
    DELETE FROM profiles WHERE id = delete_user_account.user_id;
    
    -- 5. Finally, delete from auth.users
    DELETE FROM auth.users WHERE id = delete_user_account.user_id;
  END;
END;
$$;