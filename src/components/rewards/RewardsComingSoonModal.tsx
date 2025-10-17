import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { triggerConfetti } from '@/components/ui/confetti';

interface RewardsComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RewardsComingSoonModal = ({ isOpen, onClose }: RewardsComingSoonModalProps) => {
  const { user } = useAuth();

  const handleClose = async () => {
    if (user) {
      await supabase
        .from('user_rewards')
        .upsert({ 
          user_id: user.id, 
          has_seen_rewards_popup: true 
        }, {
          onConflict: 'user_id'
        });
    }
    triggerConfetti();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center space-y-4 p-6">
          <div className="text-6xl animate-bounce">🎉</div>
          <DialogTitle className="text-2xl font-bold">
            Rewards coming soon!
          </DialogTitle>
          <p className="text-muted-foreground">
            Soon you'll earn points and bonuses for every sale made through Link2Pay. Stay tuned!
          </p>
          <Button onClick={handleClose} className="w-full">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
