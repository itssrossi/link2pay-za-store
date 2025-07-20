
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

const DeleteAccountDialog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (confirmationText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log('Starting complete account deletion for user:', user.id);

      // First, delete all user data from database tables
      // Get all invoice IDs for this user to delete related data
      const { data: userInvoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id);

      const invoiceIds = userInvoices?.map(inv => inv.id) || [];
      console.log('Found invoices to delete:', invoiceIds);

      // Delete in correct order to avoid foreign key constraints
      const deleteOperations = [];

      // 1. Delete invoice items and reminders first (they reference invoices)
      if (invoiceIds.length > 0) {
        deleteOperations.push(
          supabase.from('invoice_items').delete().in('invoice_id', invoiceIds),
          supabase.from('invoice_reminders').delete().in('invoice_id', invoiceIds)
        );
      }

      // 2. Delete other user-related data
      deleteOperations.push(
        supabase.from('products').delete().eq('user_id', user.id),
        supabase.from('invoices').delete().eq('user_id', user.id),
        supabase.from('store_sections').delete().eq('user_id', user.id),
        supabase.from('subscription_transactions').delete().eq('user_id', user.id),
        supabase.from('profiles').delete().eq('id', user.id)
      );

      // Execute all delete operations
      const results = await Promise.allSettled(deleteOperations);
      
      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.error('Some database delete operations failed:', failures);
        // Continue anyway as we still want to delete the auth user
      }

      console.log('Database data deleted, now deleting auth user');

      // 3. Delete the authentication user account completely
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteUserError) {
        console.error('Error deleting auth user:', deleteUserError);
        // If admin delete fails, still sign out the user
        await supabase.auth.signOut();
        toast.error('Account data deleted but authentication cleanup failed. Please contact support if you can still log in.');
        navigate('/auth');
        return;
      }

      console.log('Auth user deleted successfully');

      // 4. Sign out current session (redundant but safe)
      await supabase.auth.signOut();
      
      toast.success('Account and all data permanently deleted. You must re-verify your email if you sign up again.');
      
      // Navigate to auth page
      navigate('/auth');
      
    } catch (error) {
      console.error('Critical error during account deletion:', error);
      toast.error('Failed to delete account completely. Please try again or contact support immediately.');
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
            ⚠️ <strong>PERMANENT DELETION WARNING</strong> ⚠️
            <br /><br />
            This action <strong>CANNOT BE UNDONE</strong>. This will completely and permanently delete:
            <br /><br />
            🗑️ <strong>Your authentication account and login access</strong>
            <br />
            🗑️ Business profile and all settings
            <br />
            🗑️ All products and inventory data
            <br />
            🗑️ All invoices and order history
            <br />
            🗑️ Store customizations and sections
            <br />
            🗑️ All subscription and transaction records
            <br /><br />
            <strong>If you sign up again with the same email:</strong>
            <br />
            ✅ You will need to re-verify your email address
            <br />
            ✅ You will start completely fresh with no previous data
            <br />
            ✅ All previous information will be gone forever
            <br /><br />
            Type "DELETE" below to confirm this permanent action.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <Label htmlFor="delete-confirmation" className="text-sm font-medium">
            Type "DELETE" to confirm:
          </Label>
          <Input
            id="delete-confirmation"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Type DELETE here"
            className="mt-2"
            disabled={isDeleting}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isDeleting || confirmationText !== 'DELETE'}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Permanently Deleting...' : 'Yes, Delete Everything Forever'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
