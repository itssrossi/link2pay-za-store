import { useState, useEffect } from 'react';
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
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
        toast.error('Failed to get session token.');
      }
      setAccessToken(data?.session?.access_token || null);
    }
    fetchSession();
  }, []);

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      toast.error('User not found or not logged in.');
      return;
    }

    if (confirmationText !== 'DELETE') {
      toast.error('Please type DELETE to confirm.');
      return;
    }

    if (!accessToken) {
      toast.error('Unable to authenticate request. Try refreshing the page.');
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(
        'https://mpzqlidtvlbijloeusuj.supabase.co/functions/v1/delete-account',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('Deletion failed:', result);
        toast.error(result.error || 'Account deletion failed.');
        setIsDeleting(false);
        return;
      }

      await supabase.auth.signOut();
      toast.success('Your account and data have been permanently deleted.');
      navigate('/auth');
    } catch (err) {
      console.error('Unexpected deletion error:', err);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Prevent rendering until user is loaded
  if (!user) return null;

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
            <br />
            <br />
            This action <strong>CANNOT BE UNDONE</strong>. This will permanently delete:
            <br />
            <br />
            🗑️ Your login access
            <br />
            🗑️ Business profile and all settings
            <br />
            🗑️ Products and inventory
            <br />
            🗑️ Invoices and order history
            <br />
            🗑️ Store sections and layout
            <br />
            🗑️ Subscription records
            <br />
            <br />
            <strong>If you sign up again:</strong>
            <br />
            ✅ You must re-verify your email
            <br />
            ✅ You will start fresh with no previous data
            <br />
            <br />
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
