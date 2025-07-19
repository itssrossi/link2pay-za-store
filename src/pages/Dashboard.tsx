import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import OnboardingModal from '@/components/onboarding/OnboardingModal';

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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

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

      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_handle')
        .eq('id', user.id)
        .single();

      const totalRevenue = invoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0;
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Welcome back! Here's an overview of your business.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              <GrowthCTA onClick={() => setShowGrowthForm(true)} />
              <Button size="sm" className="flex-1 sm:flex-none">
                <Link to="/products/add" className="flex items-center">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Add Product</span>
                  <span className="xs:hidden">Add</span>
                </Link>
              </Button>
            </div>
            <Button size="sm" variant="outline" className="w-full sm:w-auto">
              <Link to="/invoice-builder" className="flex items-center">
                <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">New Invoice</span>
                <span className="xs:hidden">Invoice</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 sm:p-6">
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
              <p className="text-xs text-muted-foreground">
                <Badge variant={stats.pendingInvoices > 0 ? "destructive" : "secondary"} className="text-xs">
                  {stats.pendingInvoices} pending
                </Badge>
              </p>
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

          <Card className="p-4 sm:p-6">
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
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
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
                  <Button size="sm" className="w-full text-xs">
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

      <OnboardingModal />
    </Layout>
  );
};

export default Dashboard;
