
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, session, loading: authLoading } = useAuth();
  const { trialExpired, hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const location = useLocation();

  // Show loading spinner while authentication and subscription are being determined
  if (authLoading || subscriptionLoading) {
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
  if (trialExpired && !hasActiveSubscription && location.pathname !== '/billing/setup') {
    console.log('Trial expired and no subscription, redirecting to billing setup');
    return <Navigate to="/billing/setup" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
