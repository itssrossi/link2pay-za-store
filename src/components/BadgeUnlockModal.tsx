import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { triggerConfetti } from '@/components/ui/confetti';
import { playCelebrationSound } from '@/utils/celebrationSound';
import { BadgeUnlockData } from '@/utils/badgeUnlockEvent';
import { Award } from 'lucide-react';

export const BadgeUnlockModal = () => {
  const navigate = useNavigate();
  const [badgeQueue, setBadgeQueue] = useState<BadgeUnlockData[]>([]);
  const [currentBadge, setCurrentBadge] = useState<BadgeUnlockData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleBadgeUnlock = (event: Event) => {
      const customEvent = event as CustomEvent<BadgeUnlockData>;
      const badgeData = customEvent.detail;
      
      // Add to queue
      setBadgeQueue(prev => [...prev, badgeData]);
    };

    window.addEventListener('badgeUnlocked', handleBadgeUnlock);

    return () => {
      window.removeEventListener('badgeUnlocked', handleBadgeUnlock);
    };
  }, []);

  // Process queue
  useEffect(() => {
    if (badgeQueue.length > 0 && !currentBadge) {
      const nextBadge = badgeQueue[0];
      setCurrentBadge(nextBadge);
      setBadgeQueue(prev => prev.slice(1));
      setIsOpen(true);

      // Trigger celebrations
      triggerConfetti();
      playCelebrationSound();

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [badgeQueue, currentBadge]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setCurrentBadge(null);
    }, 300); // Wait for close animation
  };

  const handleViewAllBadges = () => {
    handleClose();
    navigate('/rewards');
  };

  if (!currentBadge) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-4 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${currentBadge.badgeColor}20 0%, ${currentBadge.badgeColor}40 100%)`
          }}
        />
        
        <div className="relative z-10">
          <DialogHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div 
                  className="absolute inset-0 blur-2xl opacity-50 animate-pulse"
                  style={{ background: currentBadge.badgeColor }}
                />
                <div className="relative text-8xl animate-bounce">
                  {currentBadge.badgeIcon}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm uppercase tracking-wide">
                <Award className="h-4 w-4" />
                Badge Unlocked!
              </div>
              
              <DialogTitle className="text-3xl font-extrabold" style={{ color: currentBadge.badgeColor }}>
                {currentBadge.badgeName}
              </DialogTitle>
              
              <DialogDescription className="text-base">
                {currentBadge.badgeDescription}
              </DialogDescription>
              
              <div className="text-xl font-bold text-foreground pt-2">
                +{currentBadge.points} points 🏆
              </div>
            </div>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-col gap-2 mt-6">
            <Button
              onClick={handleClose}
              className="w-full"
              size="lg"
              style={{ 
                backgroundColor: currentBadge.badgeColor,
                color: 'white'
              }}
            >
              Awesome!
            </Button>
            <Button
              onClick={handleViewAllBadges}
              variant="outline"
              className="w-full"
              size="lg"
            >
              View All Badges
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
