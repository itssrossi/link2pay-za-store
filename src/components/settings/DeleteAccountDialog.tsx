
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const DeleteAccountDialog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    
    try {
      console.log('Starting account deletion for user:', user.id);

      // First, get all invoice IDs for this user to delete related data
      const { data: userInvoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id);

      const invoiceIds = userInvoices?.map(inv => inv.id) || [];
      console.log('Found invoices to delete:', invoiceIds);

      // Delete in correct order to avoid foreign key constraints
      const deleteOperations = [];

      // 1. Delete invoice items first (they reference invoices)
      if (invoiceIds.length > 0) {
        deleteOperations.push(
          supabase.from('invoice_items').delete().in('invoice_id', invoiceIds)
        );
        deleteOperations.push(
          supabase.from('invoice_reminders').delete().in('invoice_id', invoiceIds)
        );
      }

      // 2. Delete other user-related data
      deleteOperations.push(
        supabase.from('products').delete().eq('user_id', user.id),
        supabase.from('invoices').delete().eq('user_id', user.id),
        supabase.from('store_sections').delete().eq('user_id', user.id),
        supabase.from('subscription_transactions').delete().eq('user_id', user.id)
      );

      // Execute all delete operations
      const results = await Promise.allSettled(deleteOperations);
      
      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.error('Some delete operations failed:', failures);
        // Continue anyway as we want to delete the profile and user
      }

      console.log('Deleted related data, now deleting profile');

      // 3. Delete the user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        // Continue anyway to try deleting the auth user
      }

      console.log('Profile deleted, now deleting auth user');

      // 4. Delete the authentication user account
      // Note: This requires the user to be authenticated, which they are
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteUserError) {
        console.error('Error deleting auth user:', deleteUserError);
        // If we can't delete the auth user via admin, try signing out
        await supabase.auth.signOut();
        toast.success('Account data deleted. Please contact support if you need the authentication account fully removed.');
      } else {
        console.log('Auth user deleted successfully');
        toast.success('Account and all associated data deleted successfully');
      }

      // Navigate to auth page
      navigate('/auth');
      
    } catch (error) {
      console.error('Error during account deletion:', error);
      toast.error('Failed to delete account completely. Some data may remain. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account and remove all your data including:
            <br /><br />
            • Your authentication account and login access
            <br />
            • Business profile and settings
            <br />
            • All products and inventory
            <br />
            • All invoices and order history
            <br />
            • Store customizations and sections
            <br />
            • All subscription and transaction records
            <br /><br />
            You will need to create a completely new account to use this service again.
            <br /><br />
            Are you absolutely sure you want to delete your account?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
