import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription } from '@/contexts/SubscriptionContext';

const BillingSuccess = () => {
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    // Refresh subscription status after successful payment
    const handleSuccess = async () => {
      toast.success('Subscription activated successfully!');
      
      // Wait a moment for webhooks to process
      setTimeout(async () => {
        await refreshSubscription();
        navigate('/dashboard');
      }, 2000);
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