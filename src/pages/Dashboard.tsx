import { useState, useEffect, useMemo, useCallback, lazy, Suspense, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { supabase } from '@/integrations/supabase/client';

import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  FileText,
  DollarSign,
  Users,
  TrendingUp,
  ExternalLink,
  Copy,
  Settings,
  Plus,
  Image,
  MessageCircle,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import StatsCard from '@/components/dashboard/StatsCard';
import { PersonalizationPrompt } from '@/components/PersonalizationPrompt';
import { usePersonalizationPrompts } from '@/hooks/usePersonalizationPrompts';

// Lazy load heavy components
const QuickInvoiceWhatsApp = lazy(() => import('@/components/QuickInvoiceWhatsApp'));
const GrowthCTA = lazy(() => import('@/components/GrowthCTA'));
const GrowthApplicationForm = lazy(() => import('@/components/GrowthApplicationForm'));
const InvoicesModal = lazy(() => import('@/components/InvoicesModal'));
const OnboardingProgressList = lazy(() => import('@/components/onboarding/OnboardingProgressList'));
const RotatingWelcomeMessage = lazy(() => import('@/components/RotatingWelcomeMessage').then(module => ({ default: module.RotatingWelcomeMessage })));

interface DashboardStats {
  totalProducts: number;
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  storeHandle: string;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  route: string;
  icon: string;
}

interface DashboardState {
  stats: DashboardStats;
  onboardingSteps: OnboardingStep[];
  loading: boolean;
  showGrowthForm: boolean;
  showInvoicesModal: boolean;
  hideOnboardingChecklist: boolean;
  profile?: {
    store_handle?: string;
    business_name?: string;
    logo_url?: string;
    eft_details?: string;
    payfast_link?: string;
    snapscan_link?: string;
    full_name?: string;
    onboarding_completed?: boolean;
    dashboard_visit_count?: number;
  };
}

// Memoized onboarding steps configuration
const initialOnboardingSteps: OnboardingStep[] = [
  {
    id: 'add_product',
    title: 'Add your first product',
    description: 'Create your first product listing to start selling',
    completed: false,
    route: '/products/add',
    icon: 'package'
  },
  {
    id: 'customize_store',
    title: 'Customize your store',
    description: 'Set up your business profile and branding',
    completed: false,
    route: '/settings#business',
    icon: 'palette'
  },
  {
    id: 'setup_bookings',
    title: 'Setup bookings',
    description: 'Configure appointment booking for services',
    completed: false,
    route: '/settings#booking',
    icon: 'calendar'
  },
  {
    id: 'setup_payments',
    title: 'Setup payments',
    description: 'Configure payment methods to accept payments',
    completed: false,
    route: '/settings#payment',
    icon: 'credit_card'
  },
  {
    id: 'send_invoice',
    title: 'Send your first invoice',
    description: 'Create and send your first invoice to a customer',
    completed: false,
    route: '/invoice-builder',
    icon: 'file_text'
  }
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { needsBillingSetup, showOnboarding, setShowOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();
  
  // Personalization prompts hook
  const {
    showLogoPrompt,
    showProductsPrompt,
    showQuickInvoicePrompt,
    dismissLogoPrompt,
    dismissProductsPrompt,
    dismissQuickInvoicePrompt,
    loading: promptsLoading
  } = usePersonalizationPrompts();
  
  // Consolidated state management
  const [state, setState] = useState<DashboardState>({
    stats: {
      totalProducts: 0,
      totalInvoices: 0,
      totalRevenue: 0,
      pendingInvoices: 0,
      storeHandle: ''
    },
    onboardingSteps: initialOnboardingSteps,
    loading: true,
    showGrowthForm: false,
    showInvoicesModal: false,
    hideOnboardingChecklist: false,
    profile: undefined
  });

  // Optimized data fetching - combine all queries and run in parallel
  const fetchAllDashboardData = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Run all queries in parallel for better performance
      const [
        productsResult,
        invoicesResult, 
        bookingsResult,
        profileResult,
        availabilityResult
      ] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('invoices')
          .select('id, total_amount, status, created_at')
          .eq('user_id', user.id),
        supabase
          .from('bookings')
          .select('amount_paid')
          .eq('user_id', user.id)
          .eq('payment_status', 'paid'),
        supabase
          .from('profiles')
          .select('store_handle, business_name, logo_url, eft_details, payfast_link, snapscan_link, full_name, onboarding_completed, dashboard_visit_count')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('availability_settings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ]);

      const { count: productsCount } = productsResult;
      const { data: invoices } = invoicesResult;
      const { data: bookings } = bookingsResult;
      const { data: profile } = profileResult;
      const { count: bookingsCount } = availabilityResult;

      // Increment dashboard visit count
      if (profile) {
        await supabase
          .from('profiles')
          .update({ 
            dashboard_visit_count: (profile.dashboard_visit_count || 0) + 1 
          })
          .eq('id', user.id);
      }

      // Calculate stats
      const invoiceRevenue = invoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0;
      const bookingRevenue = bookings?.reduce((sum, booking) => sum + (booking.amount_paid || 0), 0) || 0;
      const totalRevenue = invoiceRevenue + bookingRevenue;
      const pendingInvoices = invoices?.filter(inv => inv.status === 'pending').length || 0;

      // Check payment settings
      const hasPayments = profile?.eft_details || profile?.payfast_link || profile?.snapscan_link;

      // Update onboarding steps based on progress
      const updatedSteps = initialOnboardingSteps.map(step => {
        switch (step.id) {
          case 'add_product':
            return { ...step, completed: (productsCount || 0) > 0 };
          case 'customize_store':
            return { 
              ...step, 
              completed: !!(profile?.business_name && (profile?.logo_url || profile?.store_handle))
            };
          case 'setup_bookings':
            return { ...step, completed: (bookingsCount || 0) > 0 };
          case 'setup_payments':
            return { ...step, completed: !!hasPayments };
          case 'send_invoice':
            return { ...step, completed: (invoices?.length || 0) > 0 };
          default:
            return step;
        }
      });

      // Update state in a single call
      setState(prev => ({
        ...prev,
        stats: {
          totalProducts: productsCount || 0,
          totalInvoices: invoices?.length || 0,
          totalRevenue,
          pendingInvoices,
          storeHandle: profile?.store_handle || ''
        },
        onboardingSteps: updatedSteps,
        profile: profile || undefined,
        loading: false
      }));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAllDashboardData();
    }
  }, [user, fetchAllDashboardData]);

  // Memoized event handlers
  const copyStoreLink = useCallback(() => {
    if (!state.stats.storeHandle) return;
    const link = `${window.location.origin}/store/${state.stats.storeHandle}`;
    navigator.clipboard.writeText(link);
    toast.success('Store link copied to clipboard!');
  }, [state.stats.storeHandle]);

  const handleCloseOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, [setShowOnboarding]);

  const handleShowGrowthForm = useCallback(() => {
    setState(prev => ({ ...prev, showGrowthForm: true }));
  }, []);

  const handleCloseGrowthForm = useCallback(() => {
    setState(prev => ({ ...prev, showGrowthForm: false }));
  }, []);

  const handleShowInvoicesModal = useCallback(() => {
    setState(prev => ({ ...prev, showInvoicesModal: true }));
  }, []);

  const handleCloseInvoicesModal = useCallback(() => {
    setState(prev => ({ ...prev, showInvoicesModal: false }));
  }, []);

  const handleHideOnboardingChecklist = useCallback(() => {
    setState(prev => ({ ...prev, hideOnboardingChecklist: true }));
  }, []);

  // Memoized computed values
  const showOnboardingProgress = useMemo(() => {
    return !showOnboarding && 
           !state.hideOnboardingChecklist && 
           state.onboardingSteps.some(step => !step.completed);
  }, [showOnboarding, state.hideOnboardingChecklist, state.onboardingSteps]);

  const hasStoreHandle = useMemo(() => {
    return Boolean(state.stats.storeHandle);
  }, [state.stats.storeHandle]);

  // Loading component with proper skeleton
  if (state.loading) {
    return (
      <Layout>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
          <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4 sm:p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <div className="pt-2">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </Card>
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-walkthrough="dashboard-title">Dashboard</h1>
            <Suspense fallback={<p className="text-muted-foreground mt-1 text-sm sm:text-base">Welcome back!</p>}>
              <RotatingWelcomeMessage
                fullName={state.profile?.full_name}
                businessName={state.profile?.business_name}
                onboardingCompleted={state.profile?.onboarding_completed}
                onboardingSteps={state.onboardingSteps.map(step => ({ name: step.title, completed: step.completed }))}
              />
            </Suspense>
          </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              {!showOnboarding && (
                <Suspense fallback={<Skeleton className="h-9 w-24" />}>
                  <GrowthCTA onClick={handleShowGrowthForm} />
                </Suspense>
              )}
              {/* Show Rewards button on mobile, Add Product on desktop */}
              <Button size="sm" className="flex-1 sm:flex-none md:hidden" asChild>
                <Link to="/rewards" className="flex items-center">
                  <Trophy className="w-4 h-4 mr-1 sm:mr-2" />
                  <span>Rewards</span>
                </Link>
              </Button>
              <Button size="sm" className="hidden md:flex flex-1 sm:flex-none" data-walkthrough="add-product" asChild>
                <Link to="/products/add" className="flex items-center">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Add Product</span>
                  <span className="xs:hidden">Add</span>
                </Link>
              </Button>
            </div>
            <Button size="sm" variant="outline" className="w-full sm:w-auto" data-walkthrough="new-invoice" asChild>
              <Link to="/invoice-builder" className="flex items-center">
                <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">New Invoice</span>
                <span className="xs:hidden">Invoice</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Personalization Prompts */}
        <div className="space-y-3">
          {showLogoPrompt && (
            <PersonalizationPrompt
              icon={<Image className="w-5 h-5 text-blue-600" />}
              message="Add your logo for a more professional look"
              ctaText="Add Logo"
              ctaAction={() => navigate('/settings#business')}
              onDismiss={dismissLogoPrompt}
              variant="info"
            />
          )}

          {showProductsPrompt && (
            <PersonalizationPrompt
              icon={<Package className="w-5 h-5 text-green-600" />}
              message="Add your top 3 products to your storefront"
              ctaText="Add Products"
              ctaAction={() => navigate('/products/add')}
              onDismiss={dismissProductsPrompt}
              variant="success"
            />
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Onboarding Progress - Show when not completed */}
          {showOnboardingProgress && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-1 order-first">
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <OnboardingProgressList 
                  steps={state.onboardingSteps} 
                  onHide={handleHideOnboardingChecklist}
                />
              </Suspense>
            </div>
          )}
          
          <StatsCard
            title="Total Products"
            value={state.stats.totalProducts}
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
            subtitle="Active products in your store"
          />

          <StatsCard
            title="Total Invoices"
            value={state.stats.totalInvoices}
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            subtitle={
              <Badge variant={state.stats.pendingInvoices > 0 ? "destructive" : "secondary"} className="text-xs">
                {state.stats.pendingInvoices} pending
              </Badge>
            }
            onClick={handleShowInvoicesModal}
            clickable
            clickText="Click to view all invoices"
          />

          <StatsCard
            title="Total Revenue"
            value={`R${state.stats.totalRevenue.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            subtitle={
              <span className="text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                All time revenue
              </span>
            }
            isLargeValue
          />

          <Card className="p-4 sm:p-6" data-walkthrough="store-link">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-sm font-medium">Store Link</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {hasStoreHandle ? (
                <>
                  <div className="text-sm font-medium truncate">
                    /store/{state.stats.storeHandle}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 mt-2">
                    <Button onClick={copyStoreLink} size="sm" variant="outline" className="flex-1 text-xs">
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                      <Link to={`/store/${state.stats.storeHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-500">Not set up</div>
                  <p className="text-xs text-gray-600 mb-2">
                    Set up your store handle to enable your public store
                  </p>
                  <Button size="sm" className="w-full text-xs" asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="w-3 h-3 mr-1" />
                      Go to Settings
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Invoice with WhatsApp */}
        <div className="space-y-3">
          {showQuickInvoicePrompt && (
            <PersonalizationPrompt
              icon={<MessageCircle className="w-5 h-5 text-purple-600" />}
              message="Try using Quick Invoice with WhatsApp — it's faster!"
              ctaText="Try It Now"
              ctaAction={() => {
                document.getElementById('quick-invoice-whatsapp')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onDismiss={dismissQuickInvoicePrompt}
              variant="accent"
            />
          )}
          
          <div id="quick-invoice-whatsapp">
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <QuickInvoiceWhatsApp />
            </Suspense>
          </div>
        </div>



        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Dashboard loaded successfully</p>
                    <p className="text-xs text-gray-500">WhatsApp automation ready</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Suspense fallback={null}>
        <GrowthApplicationForm 
          isOpen={state.showGrowthForm} 
          onClose={handleCloseGrowthForm} 
        />
      </Suspense>

      <Suspense fallback={null}>
        <InvoicesModal 
          isOpen={state.showInvoicesModal} 
          onClose={handleCloseInvoicesModal} 
        />
      </Suspense>

      {/* Use new onboarding container - no longer needed since we use pages */}
      {/* <NewOnboardingContainer 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      /> */}
    </Layout>
  );
};

export default Dashboard;
