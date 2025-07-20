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
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
      }
      setAccessToken(data?.session?.access_token || null);
    };
    fetchSession();
  }, []);

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      toast.error('User not found or not logged in.');
      console.warn('Aborted: No user object in DeleteAccountDialog.');
      return;
    }

    if (confirmationText !== 'DELETE') {
      toast.error('Please type DELETE to confirm.');
      return;
    }

    if (!accessToken) {
      toast.error('Unable to authenticate request. Try refreshing.');
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch('https://mpzqlidtvlbijloeusuj.supabase.co/functions/v1/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Deletion failed:', result);
        toast.error(result.error || 'Account deletion failed.');
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

  if (!user) return null; // ⛔️ Prevent render until user is available

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 classNa
