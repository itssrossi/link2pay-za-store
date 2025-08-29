import React, { useEffect, useState } from 'react';
import { ChevronRight, CheckCircle } from 'lucide-react';

interface WalkthroughTooltipProps {
  targetSelector: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  showNext?: boolean;
  onNext?: () => void;
  nextText?: string;
  completed?: boolean;
}

const WalkthroughTooltip: React.FC<WalkthroughTooltipProps> = ({
  targetSelector,
  title,
  description,
  position = 'auto',
  showNext = false,
  onNext,
  nextText = 'Next',
  completed = false
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 15;
    
    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      console.log('💬 WalkthroughTooltip looking for:', targetSelector, 'found:', !!element);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          console.log('✅ Tooltip positioned for element:', rect);

          // Auto-calculate position if set to auto
          if (position === 'auto') {
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            
            // Prefer bottom, but use top if not enough space
            if (rect.bottom + 250 < windowHeight) {
              setTooltipPosition('bottom');
            } else if (rect.top - 250 > 0) {
              setTooltipPosition('top');
            } else if (rect.right + 350 < windowWidth) {
              setTooltipPosition('right');
            } else {
              setTooltipPosition('left');
            }
          } else {
            setTooltipPosition(position);
          }
          return;
        }
      }
      
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`🔄 Tooltip retry ${retryCount}/${maxRetries}`);
        setTimeout(updatePosition, 300);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetSelector, position]);

  if (!targetRect) return null;

  const getTooltipStyle = () => {
    const baseStyle = {
      position: 'fixed' as const,
      maxWidth: '320px',
      zIndex: 10002,
      pointerEvents: 'auto' as const,
    };

    switch (tooltipPosition) {
      case 'top':
        return {
          ...baseStyle,
          left: targetRect.left + (targetRect.width / 2),
          top: targetRect.top - 20,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          ...baseStyle,
          left: targetRect.left + (targetRect.width / 2),
          top: targetRect.bottom + 20,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          ...baseStyle,
          left: targetRect.left - 20,
          top: targetRect.top + (targetRect.height / 2),
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          ...baseStyle,
          left: targetRect.right + 20,
          top: targetRect.top + (targetRect.height / 2),
          transform: 'translateY(-50%)',
        };
    }
  };

  const getArrowStyle = () => {
    const arrowSize = 12;
    const baseStyle = {
      position: 'absolute' as const,
      width: 0,
      height: 0,
    };

    switch (tooltipPosition) {
      case 'top':
        return {
          ...baseStyle,
          left: '50%',
          bottom: -arrowSize,
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid white`,
        };
      case 'bottom':
        return {
          ...baseStyle,
          left: '50%',
          top: -arrowSize,
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid white`,
        };
      case 'left':
        return {
          ...baseStyle,
          right: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid white`,
        };
      case 'right':
        return {
          ...baseStyle,
          left: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid white`,
        };
    }
  };

  return (
    <div style={getTooltipStyle()}>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-5 animate-scale-in backdrop-blur-sm">
        {/* Arrow */}
        <div style={getArrowStyle()} />
        
        {/* Content */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            {completed && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />}
            <div>
              <h3 className="font-bold text-gray-900 text-base">{title}</h3>
              <p className="text-gray-700 text-sm mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          
          {showNext && onNext && (
            <div className="flex justify-end">
              <button
                onClick={onNext}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {nextText}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalkthroughTooltip;