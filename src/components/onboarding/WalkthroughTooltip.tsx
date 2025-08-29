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
    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);

        // Auto-calculate position if set to auto
        if (position === 'auto') {
          const windowHeight = window.innerHeight;
          const windowWidth = window.innerWidth;
          
          // Prefer bottom, but use top if not enough space
          if (rect.bottom + 200 < windowHeight) {
            setTooltipPosition('bottom');
          } else if (rect.top - 200 > 0) {
            setTooltipPosition('top');
          } else if (rect.right + 300 < windowWidth) {
            setTooltipPosition('right');
          } else {
            setTooltipPosition('left');
          }
        } else {
          setTooltipPosition(position);
        }
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
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-scale-in">
        {/* Arrow */}
        <div style={getArrowStyle()} />
        
        {/* Content */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            {completed && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
              <p className="text-gray-600 text-sm mt-1">{description}</p>
            </div>
          </div>
          
          {showNext && onNext && (
            <div className="flex justify-end">
              <button
                onClick={onNext}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
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