-- Drop the previous function
DROP FUNCTION IF EXISTS delete_user_account(UUID);

-- Create a trigger function that deletes all related data when a profile is deleted
CREATE OR REPLACE FUNCTION delete_user_data_cascade()
RETURNS TRIGGER AS $$
DECLARE
  invoice_ids UUID[];
BEGIN
  -- Get all invoice IDs for this user
  SELECT ARRAY(SELECT id FROM invoices WHERE user_id = OLD.id) INTO invoice_ids;
  
  -- Delete invoice items and reminders first (they reference invoices)
  IF array_length(invoice_ids, 1) > 0 THEN
    DELETE FROM invoice_items WHERE invoice_id = ANY(invoice_ids);
    DELETE FROM invoice_reminders WHERE invoice_id = ANY(invoice_ids);
  END IF;
  
  -- Delete user-owned data
  DELETE FROM products WHERE user_id = OLD.id;
  DELETE FROM invoices WHERE user_id = OLD.id;
  DELETE FROM store_sections WHERE user_id = OLD.id;
  DELETE FROM subscription_transactions WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER delete_user_data_on_profile_delete
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_user_data_cascade();