import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';

const BillingSuccess = () => {
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    // Activate subscription and refresh status after payment
    const handleSuccess = async () => {
      try {
        // Manually activate subscription since webhook might not have fired
        console.log('Activating subscription...');
        const { error } = await supabase.functions.invoke('activate-subscription');
        
        if (error) {
          console.error('Error activating subscription:', error);
          toast.error('Failed to activate subscription. Please contact support.');
          return;
        }
        
        toast.success('Subscription activated successfully!');
        
        // Wait a moment and refresh subscription status
        setTimeout(async () => {
          await refreshSubscription();
          navigate('/dashboard');
        }, 1000);
        
      } catch (error) {
        console.error('Error in handleSuccess:', error);
        toast.error('Failed to activate subscription. Please contact support.');
      }
    };

    handleSuccess();
  }, [navigate, refreshSubscription]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Subscription Activated!</h2>
          <p className="text-gray-600 mb-4">
            Your subscription has been successfully activated. You now have full access to all Link2Pay features.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your dashboard...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingSuccess;