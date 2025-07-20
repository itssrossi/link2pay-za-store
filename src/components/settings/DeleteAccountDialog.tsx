
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

      // Delete user from database using the new function
      const { error: deleteUserError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (deleteUserError) {
        console.error('Error deleting user account:', deleteUserError);
        throw deleteUserError;
      }

      console.log('User account and all associated data deleted successfully');

      // Sign out the current session
      await supabase.auth.signOut();
      
      toast.success('Account data deleted successfully. You have been signed out.');
      
      // Navigate to auth page
      navigate('/auth');
      
    } catch (error) {
      console.error('Error during account deletion:', error);
      toast.error('Failed to delete account completely. Please try again or contact support.');
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
            You will be signed out and can create a new account if needed.
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
