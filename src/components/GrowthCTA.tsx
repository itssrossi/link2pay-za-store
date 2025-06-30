
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

interface GrowthCTAProps {
  onClick: () => void;
}

const GrowthCTA = ({ onClick }: GrowthCTAProps) => {
  return (
    <Button 
      onClick={onClick}
      className="bg-[#4C9F70] hover:bg-[#3d7a59] text-white font-semibold shadow-lg"
      size="sm"
    >
      <Rocket className="w-4 h-4 mr-2" />
      🚀 Grow My Business
    </Button>
  );
};

export default GrowthCTA;
