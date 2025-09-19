import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  getOnboardingInsights, 
  getFunnelAnalysis, 
  OnboardingInsights, 
  FunnelAnalysis 
} from '@/utils/onboardingAnalytics';
import { useDevAuth } from '@/hooks/useDevAuth';
import { ArrowLeft, Users, TrendingUp, Clock, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DevDashboard = () => {
  const navigate = useNavigate();
  const { isDevAuthenticated, logout } = useDevAuth();
  const [insights, setInsights] = useState<OnboardingInsights | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelAnalysis[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'physical_products' | 'bookings'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDevAuthenticated) {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [insightsData, funnelData] = await Promise.all([
          getOnboardingInsights(),
          getFunnelAnalysis(filterType === 'all' ? undefined : filterType)
        ]);
        
        setInsights(insightsData);
        setFunnelData(funnelData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isDevAuthenticated, navigate, filterType]);

  const handleBack = () => {
    logout();
    navigate('/dashboard');
  };

  if (!isDevAuthenticated) {
    return null;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">Developer Dashboard</h1>
              <Badge variant="secondary">Dev Mode</Badge>
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
                {insights?.overall_completion_rate.toFixed(1)}% completion rate
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
                      <span className="text-green-600 font-medium">
                        {step.completions} completed ({step.completion_rate.toFixed(1)}%)
                      </span>
                      <span className="text-orange-600">
                        {step.skips} skipped
                      </span>
                      <span className="text-red-600">
                        {step.drop_offs} dropped
                      </span>
                      <span className="text-blue-600">
                        {Math.round(step.average_time_seconds / 60)}m avg
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress value={step.completion_rate} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{step.total_entries} total entries</span>
                      <span>{step.completion_rate.toFixed(1)}% completion rate</span>
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
                .filter(step => step.drop_offs > 0)
                .sort((a, b) => b.drop_offs - a.drop_offs)
                .slice(0, 5)
                .map((step) => (
                  <div key={step.step_name} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{step.step_name.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">Step {step.step_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{step.drop_offs}</p>
                      <p className="text-xs text-red-500">users dropped</p>
                    </div>
                  </div>
                ))}
              
              {funnelData.filter(step => step.drop_offs > 0).length === 0 && (
                <p className="text-muted-foreground text-center py-4">No significant drop-offs detected</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevDashboard;