
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, X } from 'lucide-react';

interface MobileStickyGrowthCTAProps {
  onClick: () => void;
}

const MobileStickyGrowthCTA = ({ onClick }: MobileStickyGrowthCTAProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isVisible || !isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden">
      <div className="bg-gradient-to-r from-[#4C9F70] to-[#3d7a59] rounded-full shadow-lg p-3 flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <Rocket className="w-5 h-5 text-white" />
          <span className="text-white font-medium text-sm">Ready to grow your business?</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={onClick}
            size="sm"
            className="bg-white text-[#4C9F70] hover:bg-gray-100 text-xs px-3 py-1 h-8"
          >
            Apply Now
          </Button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileStickyGrowthCTA;
