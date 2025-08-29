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
    const maxRetries = 20; // Increased retries
    let timeoutId: NodeJS.Timeout;
    
    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      console.log('🎯 WalkthroughSpotlight looking for:', targetSelector, 'found:', !!element);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        // Only set if element is actually visible
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          console.log('✅ Element found and positioned:', rect);
          return;
        }
      }
      
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = retryCount < 5 ? 200 : retryCount < 10 ? 500 : 1000; // Progressive delays
        console.log(`🔄 Element not found, retry ${retryCount}/${maxRetries} (delay: ${delay}ms)`);
        timeoutId = setTimeout(updatePosition, delay);
      } else {
        console.warn('❌ Element not found after max retries:', targetSelector);
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
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [targetSelector]);

  if (!targetRect) return null;

  const spotlightStyle = {
    position: 'fixed' as const, // Changed to fixed for better positioning
    left: targetRect.left - padding,
    top: targetRect.top - padding,
    width: targetRect.width + (padding * 2),
    height: targetRect.height + (padding * 2),
    border: '4px solid hsl(var(--primary))',
    borderRadius: '12px',
    boxShadow: `
      0 0 0 9999px rgba(0, 0, 0, 0.75),
      0 0 30px hsl(var(--primary)),
      inset 0 0 20px rgba(255, 255, 255, 0.1)
    `,
    pointerEvents: 'none' as const,
    zIndex: 9998,
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(1px)',
  };

  return <div style={spotlightStyle} />;
};

export default WalkthroughSpotlight;