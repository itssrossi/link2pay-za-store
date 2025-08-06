import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';

const TestTrialEndButton = () => {
  const [loading, setLoading] = useState(false);
  const { refreshSubscription } = useSubscription();

  const handleSimulateTrialEnd = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('simulate-trial-end');
      
      if (error) {
        throw error;
      }

      console.log('Trial end simulation response:', data);
      toast.success('Trial expired! You will be redirected to billing setup.');
      
      // Refresh subscription status
      await refreshSubscription();
      
      // Force a page reload to trigger the redirect
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error simulating trial end:', error);
      toast.error('Failed to simulate trial end');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="destructive"
      onClick={handleSimulateTrialEnd}
      disabled={loading}
      className="flex items-center gap-2"
    >
      <AlertTriangle className="w-4 h-4" />
      {loading ? 'Simulating...' : 'Simulate Trial End'}
    </Button>
  );
};

export default TestTrialEndButton;