import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export const Confetti: React.FC<ConfettiProps> = ({ trigger, onComplete }) => {
  useEffect(() => {
    if (trigger) {
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', '#FFD700', '#FF69B4', '#32CD32'];

      const frame = () => {
        confetti({
          particleCount: 15,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: colors,
        });
        confetti({
          particleCount: 15,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        } else {
          onComplete?.();
        }
      };

      frame();
    }
  }, [trigger, onComplete]);

  return null;
};

export const triggerConfetti = () => {
  const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', '#FFD700', '#FF69B4', '#32CD32'];
  
  confetti({
    particleCount: 50,
    angle: 90,
    spread: 45,
    origin: { x: 0.5, y: 0.7 },
    colors: colors,
  });
  
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: colors,
    });
    confetti({
      particleCount: 30,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: colors,
    });
  }, 250);
};