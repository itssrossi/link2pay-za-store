import React, { useEffect, useState } from 'react';

interface WalkthroughSpotlightProps {
  targetSelector: string;
  padding?: number;
}

const WalkthroughSpotlight: React.FC<WalkthroughSpotlightProps> = ({ 
  targetSelector, 
  padding = 8 
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    
    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      console.log('WalkthroughSpotlight looking for:', targetSelector, 'found:', !!element);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        console.log('Element found and positioned:', rect);
      } else if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Element not found, retry ${retryCount}/${maxRetries}`);
        setTimeout(updatePosition, 500);
      } else {
        console.warn('Element not found after max retries:', targetSelector);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    // Use MutationObserver to detect DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(updatePosition, 100); // Small delay for DOM to settle
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      observer.disconnect();
    };
  }, [targetSelector]);

  if (!targetRect) return null;

  const spotlightStyle = {
    position: 'absolute' as const,
    left: targetRect.left - padding,
    top: targetRect.top - padding,
    width: targetRect.width + (padding * 2),
    height: targetRect.height + (padding * 2),
    border: '3px solid hsl(var(--primary))',
    borderRadius: '8px',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px hsl(var(--primary))',
    pointerEvents: 'none' as const,
    zIndex: 9998,
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  };

  return <div style={spotlightStyle} />;
};

export default WalkthroughSpotlight;