import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search,
  Download,
  ExternalLink,
  Calendar,
  User,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import InvoiceStatusDropdown from './InvoiceStatusDropdown';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  total_amount: number;
  status: string;
  created_at: string;
  vat_enabled: boolean;
  delivery_method: string;
  show_snapscan: boolean;
  show_payfast: boolean;
}

interface InvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InvoicesModal = ({ isOpen, onClose }: InvoicesModalProps) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchInvoices();
      fetchProfile();
    }
  }, [isOpen, user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('business_name, logo_url, eft_details, snapscan_link, payfast_link')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (invoiceId: string, newStatus: string) => {
    setInvoices(invoices.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, status: newStatus }
        : invoice
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadInvoicePDF = async (invoice: Invoice) => {
    if (!profile) {
      toast.error('Profile not found. Please try again later.');
      return;
    }

    try {
      toast.info('Generating PDF...');

      // Fetch invoice items
      const { data: invoiceItems, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      if (error) throw error;

      await generateInvoicePDF({
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        client_phone: invoice.client_phone,
        business_name: profile.business_name,
        logo_url: profile.logo_url,
        items: invoiceItems?.map(item => ({
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })) || [],
        subtotal: invoice.total_amount - (invoice.vat_enabled ? invoice.total_amount * 0.15 : 0),
        vat_amount: invoice.vat_enabled ? invoice.total_amount * 0.15 : 0,
        total_amount: invoice.total_amount,
        delivery_method: invoice.delivery_method,
        eft_details: profile.eft_details,
        snapscan_link: profile.snapscan_link,
        payfast_link: profile.payfast_link,
        payment_enabled: true,
        created_at: invoice.created_at,
      });

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            All Invoices ({invoices.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Invoices Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C9F70]"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No invoices found matching your search.' : 'No invoices created yet.'}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Options</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.client_name}</div>
                          {invoice.client_email && (
                            <div className="text-sm text-gray-500">{invoice.client_email}</div>
                          )}
                          {invoice.client_phone && (
                            <div className="text-sm text-gray-500">{invoice.client_phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-[#4C9F70]">
                          R{Number(invoice.total_amount).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.delivery_method}
                          {invoice.vat_enabled && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              VAT
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusDropdown
                          invoiceId={invoice.id}
                          currentStatus={invoice.status}
                          clientName={invoice.client_name}
                          invoiceNumber={invoice.invoice_number}
                          clientPhone={invoice.client_phone}
                          onStatusChange={(newStatus) => handleStatusChange(invoice.id, newStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {invoice.show_snapscan && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${profile?.snapscan_link ? 'text-blue-600 border-blue-600' : 'text-orange-600 border-orange-600'}`}
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              SnapScan {!profile?.snapscan_link && '⚠️'}
                            </Badge>
                          )}
                          {invoice.show_payfast && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${profile?.payfast_link ? 'text-purple-600 border-purple-600' : 'text-orange-600 border-orange-600'}`}
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              PayFast {!profile?.payfast_link && '⚠️'}
                            </Badge>
                          )}
                          {!invoice.show_snapscan && !invoice.show_payfast && (
                            <span className="text-xs text-gray-400">None enabled</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a 
                              href={`/invoice/${invoice.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View
                            </a>
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadInvoicePDF(invoice)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicesModal;
