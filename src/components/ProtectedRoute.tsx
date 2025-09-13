
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, session, loading: authLoading } = useAuth();
  const { trialExpired, hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const location = useLocation();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Timeout mechanism to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading || subscriptionLoading) {
        console.warn('ProtectedRoute timeout reached - proceeding with auth check');
        setTimeoutReached(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [authLoading, subscriptionLoading]);

  // Safety mechanism for DEVJOHN bypass
  const devJohnBypass = localStorage.getItem('devjohn_bypass');
  useEffect(() => {
    if (devJohnBypass) {
      const bypassTime = parseInt(devJohnBypass);
      // Clear the bypass after 10 seconds
      if (Date.now() - bypassTime > 10000) {
        localStorage.removeItem('devjohn_bypass');
      }
    }
  }, [devJohnBypass]);

  // Show loading spinner while authentication and subscription are being determined
  if (!timeoutReached && (authLoading || subscriptionLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C9F70]"></div>
      </div>
    );
  }

  // Redirect to auth if no user or session
  if (!user || !session) {
    console.log('User not authenticated, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Redirect to billing setup if trial expired and no active subscription
  // BUT skip if we just processed DEVJOHN
  if (trialExpired && !hasActiveSubscription && location.pathname !== '/billing/setup' && !devJohnBypass) {
    console.log('Trial expired and no subscription, redirecting to billing setup');
    return <Navigate to="/billing/setup" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
