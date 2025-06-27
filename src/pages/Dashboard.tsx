
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Package, 
  FileText, 
  TrendingUp, 
  Users, 
  DollarSign,
  MessageCircle,
  ExternalLink,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  totalSales: number;
  totalInvoices: number;
  totalProducts: number;
  conversionRate: number;
}

interface Profile {
  business_name: string;
  whatsapp_number: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalInvoices: 0,
    totalProducts: 0,
    conversionRate: 0
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quickCommand, setQuickCommand] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('business_name, whatsapp_number')
        .eq('id', user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // Fetch stats
      const [invoicesRes, productsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('total_amount')
          .eq('user_id', user.id),
        supabase
          .from('products')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
      ]);

      const totalSales = invoicesRes.data?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
      const totalInvoices = invoicesRes.data?.length || 0;
      const totalProducts = productsRes.data?.length || 0;

      setStats({
        totalSales,
        totalInvoices,
        totalProducts,
        conversionRate: totalInvoices > 0 ? (totalSales / totalInvoices) * 100 : 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleQuickCommand = () => {
    if (!quickCommand.trim()) return;
    
    // Parse command: l2p:ClientName:Amount
    const parts = quickCommand.split(':');
    if (parts.length !== 3 || parts[0].toLowerCase() !== 'l2p') {
      toast.error('Invalid format. Use: l2p:ClientName:Amount');
      return;
    }

    const [, clientName, amount] = parts;
    const cleanAmount = amount.replace('R', '').trim();
    
    if (!clientName.trim() || !cleanAmount) {
      toast.error('Please provide both client name and amount');
      return;
    }

    // Generate invoice ID (simplified)
    const invoiceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate WhatsApp link
    const message = `Hey ${clientName}, here's your invoice for R${cleanAmount}: ${window.location.origin}/invoice/${invoiceId}`;
    const whatsappLink = `https://wa.me/${profile?.whatsapp_number?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    setGeneratedLink(whatsappLink);
    toast.success('WhatsApp link generated!');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const statCards = [
    {
      title: 'Total Sales',
      value: `R${stats.totalSales.toLocaleString()}`,
      icon: DollarSign,
      description: 'Revenue generated',
      color: 'text-green-600'
    },
    {
      title: 'Invoices Sent',
      value: stats.totalInvoices.toString(),
      icon: FileText,
      description: 'This month',
      color: 'text-blue-600'
    },
    {
      title: 'Active Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      description: 'In your store',
      color: 'text-purple-600'
    },
    {
      title: 'Avg. Invoice',
      value: `R${stats.totalInvoices > 0 ? Math.round(stats.totalSales / stats.totalInvoices) : 0}`,
      icon: TrendingUp,
      description: 'Per transaction',
      color: 'text-orange-600'
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.business_name || 'Entrepreneur'}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/products/add">
              <Button className="bg-[#4C9F70] hover:bg-[#3d8159]">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </Link>
            <Link to="/invoice-builder">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Command Tool */}
        <Card className="border-[#4C9F70]/20 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center text-[#4C9F70]">
              <MessageCircle className="w-5 h-5 mr-2" />
              Quick Invoice Command
            </CardTitle>
            <CardDescription>
              Generate a WhatsApp message link instantly with the format: <Badge variant="secondary">l2p:ClientName:Amount</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="command">Command</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="command"
                  placeholder="l2p:John:R750"
                  value={quickCommand}
                  onChange={(e) => setQuickCommand(e.target.value)}
                  className="font-mono"
                />
                <Button onClick={handleQuickCommand} className="bg-[#4C9F70] hover:bg-[#3d8159]">
                  Generate
                </Button>
              </div>
            </div>
            
            {generatedLink && (
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <Label className="text-sm font-medium text-gray-700">Generated WhatsApp Link:</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" className="bg-[#4C9F70] hover:bg-[#3d8159]" asChild>
                    <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link to="/products">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Package className="w-5 h-5 mr-2 text-[#4C9F70]" />
                  Manage Products
                </CardTitle>
                <CardDescription>
                  Add, edit, or remove products from your store
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link to="/orders">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <FileText className="w-5 h-5 mr-2 text-[#4C9F70]" />
                  View Orders
                </CardTitle>
                <CardDescription>
                  Track all your invoices and orders
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link to="/settings">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Users className="w-5 h-5 mr-2 text-[#4C9F70]" />
                  Store Settings
                </CardTitle>
                <CardDescription>
                  Configure payments and store details
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
