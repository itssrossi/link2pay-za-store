
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import QuickInvoice from '@/components/QuickInvoice';
import MetaTags from '@/components/MetaTags';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Package, FileText, Settings, ExternalLink, Copy, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalInvoices: number;
  pendingInvoices: number;
  storeHandle: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    storeHandle: ''
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('store_handle')
        .eq('id', user.id)
        .single();

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const products = productsData || [];
      const invoices = invoicesData || [];

      setStats({
        totalProducts: products.length,
        activeProducts: products.filter(p => p.is_active).length,
        totalInvoices: invoices.length,
        pendingInvoices: invoices.filter(i => i.status === 'pending').length,
        storeHandle: profileData?.store_handle || ''
      });

      setRecentProducts(products.slice(0, 5));
      setRecentInvoices(invoices.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyStoreLink = () => {
    if (!stats.storeHandle) {
      toast.error('Please set a store handle in Settings first');
      return;
    }
    const storeUrl = `${window.location.origin}/store/${stats.storeHandle}`;
    navigator.clipboard.writeText(storeUrl);
    toast.success('Store link copied to clipboard!');
  };

  const copyInvoiceLink = (invoiceId: string) => {
    const invoiceUrl = `${window.location.origin}/invoice/${invoiceId}`;
    navigator.clipboard.writeText(invoiceUrl);
    toast.success('Invoice link copied to clipboard!');
  };

  const chartData = [
    { name: 'Products', value: stats.totalProducts, color: '#4C9F70' },
    { name: 'Invoices', value: stats.totalInvoices, color: '#3d8159' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C9F70]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <MetaTags 
        title="Dashboard - Link2Pay"
        description="Manage your invoices, products and business with Link2Pay"
      />
      <Layout>
        <div className="space-y-4 sm:space-y-8 px-2 sm:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Welcome back! Here's what's happening with your business.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="bg-[#4C9F70] hover:bg-[#3d8159] text-sm" size={isMobile ? "sm" : "default"}>
                <Link to="/products/add">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Link>
              </Button>
              <Button asChild variant="outline" size={isMobile ? "sm" : "default"}>
                <Link to="/invoice-builder">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Invoice
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Invoice Generator */}
          <QuickInvoice />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingBag className="w-5 h-5" />
                  Your Store
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.storeHandle ? (
                  <>
                    <p className="text-sm text-gray-600 break-all">
                      Store URL: /store/{stats.storeHandle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={copyStoreLink} size="sm" variant="outline" className="flex-1">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Link to={`/store/${stats.storeHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Preview
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">
                      Set up your store handle to enable your public store
                    </p>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Link to="/settings" className="flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Go to Settings
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-[#4C9F70]">
                      {stats.activeProducts}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Active Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-[#4C9F70]">
                      {stats.pendingInvoices}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Pending Invoices</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeProducts} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Active Products</CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.activeProducts}</div>
                <p className="text-xs text-muted-foreground">
                  Currently visible
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Pending Invoices</CardTitle>
                <FileText className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pendingInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Recent Products */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Products</CardTitle>
                <CardDescription className="text-sm">Your latest added products</CardDescription>
              </CardHeader>
              <CardContent>
                {recentProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-sm">No products yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{product.title}</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            R{product.price.toFixed(2)} • {product.category}
                          </p>
                        </div>
                        <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-xs ml-2">
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Invoices</CardTitle>
                <CardDescription className="text-sm">Your latest created invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {recentInvoices.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-sm">No invoices yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">#{invoice.invoice_number}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {invoice.client_name} • R{invoice.total_amount.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant={
                            invoice.status === 'paid' ? 'default' : 
                            invoice.status === 'pending' ? 'secondary' : 'outline'
                          } className="text-xs">
                            {invoice.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyInvoiceLink(invoice.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Overview Chart */}
          {(stats.totalProducts > 0 || stats.totalInvoices > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Overview</CardTitle>
                <CardDescription className="text-sm">Your business at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={isMobile ? 40 : 60}
                        outerRadius={isMobile ? 80 : 120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </>
  );
};

export default Dashboard;
