import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface WalkthroughOverlayProps {
  children: ReactNode;
  onSkip?: () => void;
}

const WalkthroughOverlay: React.FC<WalkthroughOverlayProps> = ({ children, onSkip }) => {
  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay with blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" />
      
      {/* Skip button */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-sm font-medium transition-all pointer-events-auto z-[10000]"
        >
          Skip Onboarding
        </button>
      )}
      
      {/* Content */}
      <div className="relative z-[10000] pointer-events-auto">
        {children}
      </div>
    </div>,
    document.body
  );
};

export default WalkthroughOverlay;