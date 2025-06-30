
import React from 'react';
import { Button } from '@/components/ui/button';
import { useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { X, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const OverlayTutorial: React.FC = () => {
  const {
    showOverlayTutorial,
    setShowOverlayTutorial,
    overlayStep,
    setOverlayStep,
  } = useOnboardingFlow();
  
  const location = useLocation();
  const navigate = useNavigate();

  if (!showOverlayTutorial) return null;

  const handleNext = () => {
    const nextStep = overlayStep + 1;
    
    // Navigate between pages based on step
    if (overlayStep === 4 && location.pathname !== '/invoice-builder') {
      navigate('/invoice-builder');
      setOverlayStep(5);
    } else if (overlayStep === 7 && location.pathname !== '/products') {
      navigate('/products');
      setOverlayStep(8);
    } else if (overlayStep === 9 && location.pathname !== '/settings') {
      navigate('/settings');
      setOverlayStep(10);
    } else if (nextStep > 12) {
      setShowOverlayTutorial(false);
    } else {
      setOverlayStep(nextStep);
    }
  };

  const handleClose = () => {
    setShowOverlayTutorial(false);
  };

  const getTooltipContent = () => {
    const currentPath = location.pathname;
    
    switch (overlayStep) {
      case 1:
        return {
          title: "Welcome to your Dashboard!",
          description: "See total revenue, visits, and invoices at a glance.",
          position: "center"
        };
      case 2:
        return {
          title: "Quick Stats",
          description: "Track your business performance here.",
          position: "top-left"
        };
      case 3:
        return {
          title: "Create Invoice",
          description: "Send your first invoice to a customer.",
          position: "top-right"
        };
      case 4:
        return {
          title: "Quick Commands",
          description: "Use commands like l2p:Name:Amount:ProductID to send faster.",
          position: "center"
        };
      case 5:
        if (currentPath === '/invoice-builder') {
          return {
            title: "Client Details",
            description: "Start by filling in your client's details.",
            position: "top"
          };
        }
        break;
      case 6:
        if (currentPath === '/invoice-builder') {
          return {
            title: "Amount & Product",
            description: "Choose a saved product or set a custom amount.",
            position: "center"
          };
        }
        break;
      case 7:
        if (currentPath === '/invoice-builder') {
          return {
            title: "Payment Options",
            description: "Add SnapScan or PayFast links here.",
            position: "bottom"
          };
        }
        break;
      case 8:
        if (currentPath === '/products') {
          return {
            title: "Add Products",
            description: "Use this to create quick-select items.",
            position: "top-right"
          };
        }
        break;
      case 9:
        if (currentPath === '/products') {
          return {
            title: "Product Management",
            description: "Edit or delete saved products anytime.",
            position: "center"
          };
        }
        break;
      case 10:
        if (currentPath === '/settings') {
          return {
            title: "Store Branding",
            description: "Brand your store link and match your style.",
            position: "top"
          };
        }
        break;
      case 11:
        if (currentPath === '/settings') {
          return {
            title: "Payment Setup",
            description: "Paste payment links or EFT info here.",
            position: "center"
          };
        }
        break;
      case 12:
        return {
          title: "You're ready to go!",
          description: "Create your first invoice or share your store with a customer.",
          position: "center"
        };
      default:
        return {
          title: "Tutorial Step",
          description: "Follow along to learn Link2Pay.",
          position: "center"
        };
    }
    
    return {
      title: "Tutorial",
      description: "Continue learning Link2Pay.",
      position: "center"
    };
  };

  const tooltip = getTooltipContent();

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      {/* Tooltip */}
      <div className={`absolute ${
        tooltip.position === 'center' ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' :
        tooltip.position === 'top' ? 'top-20 left-1/2 transform -translate-x-1/2' :
        tooltip.position === 'top-left' ? 'top-20 left-4' :
        tooltip.position === 'top-right' ? 'top-20 right-4' :
        tooltip.position === 'bottom' ? 'bottom-20 left-1/2 transform -translate-x-1/2' :
        'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
      } bg-white rounded-lg shadow-lg p-4 max-w-sm mx-4`}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{tooltip.title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">{tooltip.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {overlayStep} of 12
          </span>
          
          <Button
            onClick={handleNext}
            size="sm"
            className="bg-[#4C9F70] hover:bg-[#3d8159]"
          >
            {overlayStep === 12 ? 'Finish' : 'Next'}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OverlayTutorial;
