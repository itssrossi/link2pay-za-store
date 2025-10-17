import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FileText, Users } from 'lucide-react';

interface WeeklySummaryProps {
  weeklyEarnings: number;
  invoicesSent: number;
  repeatCustomers: number;
}

export const WeeklySummary = ({ weeklyEarnings, invoicesSent, repeatCustomers }: WeeklySummaryProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week's Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            R{weeklyEarnings.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last 7 days
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invoices Sent</CardTitle>
          <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {invoicesSent}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last 7 days
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {repeatCustomers}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last 30 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
