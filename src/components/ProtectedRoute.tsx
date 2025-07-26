
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, session, loading } = useAuth();
  const { needsBillingSetup } = useOnboarding();
  const location = useLocation();

  // Show loading spinner while authentication is being determined
  if (loading) {
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

  // Redirect to billing setup if needed (except if already on billing setup page)
  if (needsBillingSetup && location.pathname !== '/billing-setup') {
    console.log('User needs billing setup, redirecting');
    return <Navigate to="/billing-setup" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
