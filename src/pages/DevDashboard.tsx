import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  getOnboardingInsights, 
  getFunnelAnalysis, 
  OnboardingInsights, 
  FunnelAnalysis 
} from '@/utils/onboardingAnalytics';
import { 
  getRetentionStats, 
  getRecentNotifications, 
  getUserActivityBreakdown,
  RetentionStats,
  UserNotification,
  UserActivity
} from '@/utils/retentionAnalytics';
import { useDevAuth } from '@/hooks/useDevAuth';
import { ArrowLeft, Users, TrendingUp, Clock, Filter, CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CardDescription } from '@/components/ui/card';

const DevDashboard = () => {
  const navigate = useNavigate();
  const { isDevAuthenticated, logout } = useDevAuth();
  const [insights, setInsights] = useState<OnboardingInsights | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelAnalysis[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'physical_products' | 'bookings'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // Last 30 days
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retentionStats, setRetentionStats] = useState<RetentionStats[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [insightsData, funnelData, retention, notifs, activity] = await Promise.all([
          getOnboardingInsights(startDate, endDate, true),
          getFunnelAnalysis(filterType === 'all' ? undefined : filterType, startDate, endDate, true),
          getRetentionStats(
            startDate ? startDate.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate ? endDate.toISOString() : new Date().toISOString()
          ),
          getRecentNotifications(20),
          getUserActivityBreakdown()
        ]);
        setInsights(insightsData);
        setFunnelData(funnelData);
        setRetentionStats(retention);
        setNotifications(notifs);
        setUserActivity(activity);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (!isDevAuthenticated) {
      setLoading(false);
      return;
    }

    fetchData();
  }, [isDevAuthenticated, filterType, startDate, endDate]);

  const handleBack = () => {
    logout();
    navigate('/dashboard');
  };

  const setDatePreset = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case '7d':
        setStartDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        setEndDate(now);
        break;
      case '30d':
        setStartDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
        setEndDate(now);
        break;
      case '90d':
        setStartDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000));
        setEndDate(now);
        break;
      case 'all':
        setStartDate(undefined);
        setEndDate(undefined);
        break;
    }
  };

  if (!isDevAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Developer access required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Enter dev mode from the app to view analytics.</p>
            <Button onClick={handleBack}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleBack}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">Developer Dashboard</h1>
              <Badge variant="secondary">Dev Mode</Badge>
            </div>
            
            <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
              {/* Date Range Preset Buttons */}
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setDatePreset('7d')}>Last 7 days</Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset('30d')}>Last 30 days</Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset('90d')}>Last 90 days</Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset('all')}>All time</Button>
              </div>
              
              {/* Date Pickers */}
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-36 justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM dd") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date > new Date() || (endDate && date > endDate)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-36 justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM dd") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date > new Date() || (startDate && date < startDate)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="physical_products">Physical Products</SelectItem>
                    <SelectItem value="bookings">Bookings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Date Range Display */}
          {(startDate || endDate) && (
            <div className="text-sm text-muted-foreground mt-2">
              Showing data {startDate ? `from ${format(startDate, "MMM dd, yyyy")}` : 'from beginning'} 
              {endDate ? ` to ${format(endDate, "MMM dd, yyyy")}` : ' to now'}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users Started</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights?.total_users_started || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights?.total_users_completed || 0}</div>
              <p className="text-xs text-muted-foreground">
                {Number(insights?.overall_completion_rate ?? 0).toFixed(1)}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights?.average_completion_time_minutes || 0}m</div>
              <p className="text-xs text-muted-foreground">
                Average completion time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Choice Split</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Products:</span>
                  <span className="font-medium">{insights?.choice_breakdown.physical_products || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bookings:</span>
                  <span className="font-medium">{insights?.choice_breakdown.bookings || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onboarding Funnel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Onboarding Funnel Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {funnelData.map((step, index) => (
                <div key={step.step_name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{step.step_number}</Badge>
                      <span className="font-medium capitalize">{step.step_name.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-muted-foreground" title="Total users who reached this step">
                        {step.entries} entries
                      </span>
                      <span className="text-green-600 font-medium" title="Users who completed or skipped this step">
                        {step.completions} completed ({Number(step.completion_rate ?? 0).toFixed(1)}%)
                      </span>
                      <span className="text-orange-600" title="Users who skipped this step">
                        {step.skips} skipped
                      </span>
                       <span className="text-red-600" title="Users who didn't progress to the next step">
                         {step.dropOffs} dropped
                       </span>
                       <span className="text-blue-600" title="Average time spent on this step">
                         {Math.round((step.avg_time_seconds ?? 0) / 60)}m avg
                      </span>
                    </div>
                  </div>
                  
                   <div className="space-y-1">
                     <Progress value={step.completion_rate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{step.entries} users reached this step</span>
                        <span>{Number(step.completion_rate ?? 0).toFixed(1)}% moved forward</span>
                      </div>
                   </div>
                  
                  {index < funnelData.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Drop-off Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Drop-off Points</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {funnelData
                 .filter(step => step.dropOffs > 0)
                 .sort((a, b) => b.dropOffs - a.dropOffs)
                 .slice(0, 5)
                 .map((step) => (
                   <div key={step.step_name} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                     <div>
                       <p className="font-medium capitalize">{step.step_name.replace('_', ' ')}</p>
                       <p className="text-sm text-muted-foreground">Step {step.step_number}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-lg font-bold text-red-600">{step.dropOffs}</p>
                       <p className="text-xs text-red-500">users dropped</p>
                     </div>
                   </div>
                 ))}
               
               {funnelData.filter(step => step.dropOffs > 0).length === 0 && (
                 <p className="text-muted-foreground text-center py-4">No significant drop-offs detected</p>
               )}
             </div>
          </CardContent>
        </Card>

        {/* Retention Monitoring Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Retention Monitoring</h2>
          
          {/* Retention Overview Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <span className="text-2xl">🟢</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userActivity.filter(u => u.tag === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userActivity.length > 0 
                    ? `${((userActivity.filter(u => u.tag === 'active').length / userActivity.length) * 100).toFixed(1)}% of users`
                    : 'No data yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At Risk Users</CardTitle>
                <span className="text-2xl">🟠</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userActivity.filter(u => u.tag === 'at_risk').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userActivity.length > 0 
                    ? `${((userActivity.filter(u => u.tag === 'at_risk').length / userActivity.length) * 100).toFixed(1)}% of users`
                    : 'No data yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dormant Users</CardTitle>
                <span className="text-2xl">🔵</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userActivity.filter(u => u.tag === 'dormant').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userActivity.length > 0 
                    ? `${((userActivity.filter(u => u.tag === 'dormant').length / userActivity.length) * 100).toFixed(1)}% of users`
                    : 'No data yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                <span className="text-2xl">📊</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userActivity.length > 0 
                    ? `${((userActivity.filter(u => u.tag === 'active').length / userActivity.length) * 100).toFixed(1)}%`
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active user retention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Retention Trend Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Retention Trends</CardTitle>
              <CardDescription>User activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              {retentionStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={retentionStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="active_count" stroke="#22c55e" name="Active" />
                    <Line type="monotone" dataKey="at_risk_count" stroke="#f97316" name="At Risk" />
                    <Line type="monotone" dataKey="dormant_count" stroke="#3b82f6" name="Dormant" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No retention data available yet. Run the edge function to generate data.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Last 20 retention emails sent</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">User</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Message</th>
                        <th className="text-left p-2">Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notifications.map(notif => (
                        <tr key={notif.id} className="border-b">
                          <td className="p-2">{notif.user_email || 'N/A'}</td>
                          <td className="p-2">
                            <Badge variant={
                              notif.message_type === 'active' ? 'default' :
                              notif.message_type === 'at_risk' ? 'secondary' :
                              'outline'
                            }>
                              {notif.message_type === 'active' ? '🟢' : notif.message_type === 'at_risk' ? '🟠' : '🔵'}
                              {' '}{notif.message_type}
                            </Badge>
                          </td>
                          <td className="p-2 max-w-md truncate">{notif.message_content}</td>
                          <td className="p-2">{new Date(notif.sent_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No notifications sent yet. Edge function will populate this when it runs.</p>
              )}
            </CardContent>
          </Card>

          {/* User Activity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>User Activity Breakdown</CardTitle>
              <CardDescription>Current status of all users</CardDescription>
            </CardHeader>
            <CardContent>
              {userActivity.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">User</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Last Invoice</th>
                        <th className="text-left p-2">Last Visit</th>
                        <th className="text-left p-2">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userActivity.map(activity => (
                        <tr key={activity.id} className="border-b">
                          <td className="p-2">{activity.user_email || 'N/A'}</td>
                          <td className="p-2">
                            <Badge variant={
                              activity.tag === 'active' ? 'default' :
                              activity.tag === 'at_risk' ? 'secondary' :
                              'outline'
                            }>
                              {activity.tag === 'active' ? '🟢' : activity.tag === 'at_risk' ? '🟠' : '🔵'}
                              {' '}{activity.tag}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {activity.last_invoice_at 
                              ? new Date(activity.last_invoice_at).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="p-2">
                            {activity.last_dashboard_visit 
                              ? new Date(activity.last_dashboard_visit).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="p-2">{new Date(activity.tag_updated_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No user activity data yet. Edge function will populate this when it runs.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DevDashboard;