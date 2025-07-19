
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SubscriptionInfo {
  has_active_subscription: boolean;
  trial_ends_at: string;
  subscription_price: number;
  discount_applied: boolean;
  cancelled_at: string | null;
  billing_failures: number;
  payfast_billing_token: string | null;
}

const SubscriptionTab = () => {
  const { user } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchSubscriptionInfo();
    fetchTransactions();
  }, [user]);

  const fetchSubscriptionInfo = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_active_subscription, trial_ends_at, subscription_price, discount_applied, cancelled_at, billing_failures, payfast_billing_token')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setSubscriptionInfo(data);
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscription_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const cancelSubscription = async () => {
    setCancelling(true);

    try {
      const { error } = await supabase.functions.invoke('cancel-subscription');
      
      if (error) throw error;

      toast.success('Subscription cancelled successfully');
      fetchSubscriptionInfo();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading subscription info...</div>;
  }

  if (!subscriptionInfo) {
    return <div>Unable to load subscription information.</div>;
  }

  const isTrialActive = new Date(subscriptionInfo.trial_ends_at) > new Date();
  const trialDaysLeft = Math.ceil((new Date(subscriptionInfo.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Current Plan</h3>
              <p className="text-sm text-gray-600">
                R{subscriptionInfo.subscription_price}/month
                {subscriptionInfo.discount_applied && (
                  <Badge variant="secondary" className="ml-2">BETA50 Applied</Badge>
                )}
              </p>
            </div>
            {subscriptionInfo.has_active_subscription ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            ) : isTrialActive ? (
              <Badge className="bg-blue-100 text-blue-800">
                <Clock className="w-3 h-3 mr-1" />
                Trial ({trialDaysLeft} days left)
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>

          {isTrialActive && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Trial Period</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Your free trial ends on {new Date(subscriptionInfo.trial_ends_at).toLocaleDateString()}
                {trialDaysLeft <= 2 && (
                  <span className="text-orange-600 font-medium"> - Setup billing soon!</span>
                )}
              </p>
            </div>
          )}

          {subscriptionInfo.billing_failures > 0 && (
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Billing Issue</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                {subscriptionInfo.billing_failures} failed payment attempt(s). 
                {subscriptionInfo.billing_failures >= 3 && " Your account has been suspended."}
              </p>
            </div>
          )}

          {subscriptionInfo.cancelled_at && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Subscription cancelled on {new Date(subscriptionInfo.cancelled_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {subscriptionInfo.has_active_subscription && !subscriptionInfo.cancelled_at && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Cancel Subscription</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your subscription? You'll lose access to:
                    <br />• Unlimited products and invoices
                    <br />• WhatsApp automation
                    <br />• Custom store design
                    <br />• PayFast payment processing
                    <br /><br />
                    You can reactivate anytime by setting up billing again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={cancelSubscription}
                    disabled={cancelling}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500">No billing history yet.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{transaction.reference}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {transaction.amount && (
                      <p className="font-medium">R{transaction.amount}</p>
                    )}
                    <Badge 
                      variant={
                        transaction.status === 'completed' ? 'default' : 
                        transaction.status === 'failed' ? 'destructive' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionTab;
