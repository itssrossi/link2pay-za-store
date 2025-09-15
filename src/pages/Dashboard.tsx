import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { supabase } from '@/integrations/supabase/client';

import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Package,
  FileText,
  DollarSign,
  Users,
  TrendingUp,
  ExternalLink,
  Copy,
  Settings,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import QuickInvoiceWhatsApp from '@/components/QuickInvoiceWhatsApp';
import GrowthCTA from '@/components/GrowthCTA';
import GrowthApplicationForm from '@/components/GrowthApplicationForm';
import InvoicesModal from '@/components/InvoicesModal';
import NewOnboardingContainer from '@/components/onboarding/NewOnboardingContainer';
import OnboardingProgressList from '@/components/onboarding/OnboardingProgressList';

interface DashboardStats {
  totalProducts: number;
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  storeHandle: string;
  monthlyData: Array<{
    month: string;
    revenue: number;
    invoices: number;
  }>;
  statusData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { needsBillingSetup, showOnboarding, setShowOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();
  const [onboardingSteps, setOnboardingSteps] = useState([
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
  ]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    storeHandle: '',
    monthlyData: [],
    statusData: []
  });
  const [loading, setLoading] = useState(true);
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [hideOnboardingChecklist, setHideOnboardingChecklist] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      checkOnboardingProgress();
    }
  }, [user]);

  const checkOnboardingProgress = async () => {
    if (!user) return;

    try {
      // Check products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Check profile completeness
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name, logo_url, store_handle, eft_details, payfast_link, snapscan_link')
        .eq('id', user.id)
        .maybeSingle();

      // Check invoices
      const { count: invoicesCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Check availability settings for bookings
      const { count: bookingsCount } = await supabase
        .from('availability_settings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Check payment settings
      const hasPayments = profile?.eft_details || profile?.payfast_link || profile?.snapscan_link;

      // Update steps based on actual progress
      setOnboardingSteps(prev => prev.map(step => {
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
            return { ...step, completed: (invoicesCount || 0) > 0 };
          default:
            return step;
        }
      }));
    } catch (error) {
      console.error('Error checking onboarding progress:', error);
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch invoices data
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id);

      // Fetch paid bookings data
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid');

      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_handle')
        .eq('id', user.id)
        .maybeSingle();

      const invoiceRevenue = invoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0;
      const bookingRevenue = bookings?.reduce((sum, booking) => sum + (booking.amount_paid || 0), 0) || 0;
      const totalRevenue = invoiceRevenue + bookingRevenue;
      const pendingInvoices = invoices?.filter(inv => inv.status === 'pending').length || 0;

      // Monthly Data
      const monthlyData = invoices?.reduce((acc: any, invoice) => {
        const month = new Date(invoice.created_at).toLocaleString('default', { month: 'short' });
        const existingMonth = acc.find((item: any) => item.month === month);

        if (existingMonth) {
          existingMonth.revenue += invoice.total_amount;
          existingMonth.invoices += 1;
        } else {
          acc.push({ month, revenue: invoice.total_amount, invoices: 1 });
        }
        return acc;
      }, []);

      // Status Data
      const statusData = invoices?.reduce((acc: any, invoice) => {
        const status = invoice.status || 'unknown';
        const existingStatus = acc.find((item: any) => item.name === status);

        if (existingStatus) {
          existingStatus.value += 1;
        } else {
          acc.push({ name: status, value: 1, color: getRandomColor() });
        }
        return acc;
      }, []);

      function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }

      setStats({
        totalProducts: productsCount || 0,
        totalInvoices: invoices?.length || 0,
        totalRevenue,
        pendingInvoices,
        storeHandle: profile?.store_handle || '',
        monthlyData: [],
        statusData: []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyStoreLink = () => {
    if (!stats.storeHandle) return;
    const link = `${window.location.origin}/store/${stats.storeHandle}`;
    navigator.clipboard.writeText(link);
    toast.success('Store link copied to clipboard!');
  };


  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" data-walkthrough="dashboard-title">Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Welcome back! Here's an overview of your business.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              {!showOnboarding && <GrowthCTA onClick={() => setShowGrowthForm(true)} />}
              <Button size="sm" className="flex-1 sm:flex-none" data-walkthrough="add-product" asChild>
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

        {/* Quick Stats */}
        <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Onboarding Progress - Show when not completed */}
          {!showOnboarding && !hideOnboardingChecklist && onboardingSteps.some(step => !step.completed) && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-1 order-first">
              <OnboardingProgressList 
                steps={onboardingSteps} 
                onHide={() => setHideOnboardingChecklist(true)}
              />
            </div>
          )}
          
          <Card className="p-3 sm:p-4 lg:p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Active products in your store
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow p-4 sm:p-6" 
            onClick={() => setShowInvoicesModal(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <div className="text-xs text-muted-foreground">
                <Badge variant={stats.pendingInvoices > 0 ? "destructive" : "secondary"} className="text-xs">
                  {stats.pendingInvoices} pending
                </Badge>
              </div>
              <p className="text-xs text-blue-600 mt-1">Click to view all invoices</p>
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-xl sm:text-2xl font-bold">R{stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                All time revenue
              </p>
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-6" data-walkthrough="store-link">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-sm font-medium">Store Link</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {stats.storeHandle ? (
                <>
                  <div className="text-sm font-medium truncate">
                    /store/{stats.storeHandle}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 mt-2">
                    <Button onClick={copyStoreLink} size="sm" variant="outline" className="flex-1 text-xs">
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                      <Link to={`/store/${stats.storeHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
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
        <QuickInvoiceWhatsApp />



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

      <GrowthApplicationForm 
        isOpen={showGrowthForm} 
        onClose={() => setShowGrowthForm(false)} 
      />

      <InvoicesModal 
        isOpen={showInvoicesModal} 
        onClose={() => setShowInvoicesModal(false)} 
      />

      {/* Use new onboarding container - no longer needed since we use pages */}
      {/* <NewOnboardingContainer 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      /> */}
    </Layout>
  );
};

export default Dashboard;
