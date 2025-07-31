
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import SubscriptionSetup from './onboarding/SubscriptionSetup';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: string;
}

const SubscriptionGuard = ({ children, feature }: SubscriptionGuardProps) => {
  const { hasActiveSubscription, isTrialActive, trialDaysLeft, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Allow access if subscription is active or trial is still active
  if (hasActiveSubscription || isTrialActive) {
    return <>{children}</>;
  }

  // Show upgrade prompt if neither subscription nor trial is active
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle>Subscription Required</CardTitle>
          <p className="text-sm text-gray-600">
            Your free trial has ended. Activate your subscription to continue using{' '}
            {feature || 'Link2Pay'}.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">What you'll get:</h4>
            <ul className="text-sm space-y-1">
              <li>• Unlimited products & invoices</li>
              <li>• WhatsApp automation</li>
              <li>• Custom store design</li>
              <li>• Paystack payment processing</li>
            </ul>
            <div className="mt-3 font-bold text-lg">
              Only R95/month
              <span className="text-sm font-normal text-gray-600 ml-2">
                (or R50 with BETA50 code)
              </span>
            </div>
          </div>

          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <Link to="/settings?tab=subscription">
              <CreditCard className="w-4 h-4 mr-2" />
              Activate Subscription
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGuard;
