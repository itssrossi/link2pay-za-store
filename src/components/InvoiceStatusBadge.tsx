
import { Badge } from '@/components/ui/badge';

interface InvoiceStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const InvoiceStatusBadge = ({ status, size = 'md' }: InvoiceStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return {
          emoji: '🟢',
          label: 'Paid',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'pending':
        return {
          emoji: '🟡',
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'cancelled':
        return {
          emoji: '🔴',
          label: 'Cancelled',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'overdue':
        return {
          emoji: '🔘',
          label: 'Overdue',
          className: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      default:
        return {
          emoji: '🟡',
          label: 'Pending',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : size === 'lg' ? 'text-lg px-4 py-2' : 'text-sm px-3 py-1';

  return (
    <Badge className={`${config.className} ${sizeClass} font-medium border`}>
      <span className="mr-1">{config.emoji}</span>
      {config.label}
    </Badge>
  );
};

export default InvoiceStatusBadge;
