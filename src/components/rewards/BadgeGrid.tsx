import { Card, CardContent } from '@/components/ui/card';
import { BADGES, Badge } from '@/types/rewards';
import { Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface BadgeGridProps {
  unlockedBadges: string[];
}

export const BadgeGrid = ({ unlockedBadges }: BadgeGridProps) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {BADGES.map((badge) => {
          const isUnlocked = unlockedBadges.includes(badge.id);
          return (
            <Card
              key={badge.id}
              className={`cursor-pointer transition-all hover:scale-105 ${
                isUnlocked
                  ? 'bg-gradient-to-br from-background to-accent/10 shadow-lg'
                  : 'bg-muted/50 opacity-60 grayscale'
              }`}
              onClick={() => setSelectedBadge(badge)}
            >
              <CardContent className="flex flex-col items-center justify-center p-4 space-y-2">
                <div className="relative">
                  <div className="text-4xl">{badge.icon}</div>
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-center">{badge.name}</p>
                {isUnlocked && (
                  <div className="text-xs text-primary font-semibold">+{badge.points} pts</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-5xl">{selectedBadge?.icon}</div>
              <div>
                <DialogTitle>{selectedBadge?.name}</DialogTitle>
                <div className="text-sm text-primary font-semibold">+{selectedBadge?.points} points</div>
              </div>
            </div>
            <DialogDescription className="text-base">
              {selectedBadge?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="text-sm text-muted-foreground">
              {unlockedBadges.includes(selectedBadge?.id || '') ? (
                <span className="text-green-600 dark:text-green-400 font-medium">✓ Unlocked</span>
              ) : (
                <span className="text-muted-foreground">🔒 Locked</span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
