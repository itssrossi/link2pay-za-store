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
      toast.error('Please type DELETE to confirm.');
      return;
    }

    try {
      setIsDeleting(true);
      console.log('Calling delete_user_completely for:', user.id);

      // 🔥 Call Supabase RPC to delete user completely
      const { error } = await supabase.rpc('delete_user_completely', {
        p_uid: user.id,
      });

      if (error) {
        console.error('Failed to delete user data:', error);
        toast.error('Account deletion failed. Please try again.');
        return;
      }

      // ✅ Sign out user
      await supabase.auth.signOut();

      toast.success('Your account and data have been permanently deleted.');
      navigate('/auth'); // or '/goodbye' if you have one
    } catch (err) {
      console.error('Unexpected deletion error:', err);
      toast.error('Something went wrong. Please try again later.');
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
            This action <strong>CANNOT BE UNDONE</strong>. This will permanently delete:
            <br /><br />
            🗑️ Your login access<br />
            🗑️ Business profile and all settings<br />
            🗑️ Products and inventory<br />
            🗑️ Invoices and order history<br />
            🗑️ Store sections and layout<br />
            🗑️ Subscription records<br /><br />
            <strong>If you sign up again:</strong><br />
            ✅ You must re-verify your email<br />
            ✅ You will start fresh with no previous data<br /><br />
            Type "DELETE" below to confirm this action.
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
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isDeleting || confirmationText !== 'DELETE'}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete Everything Forever'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;

