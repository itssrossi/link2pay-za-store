import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Settings, Calendar } from 'lucide-react';

interface BookingPaymentSettingsData {
  booking_payments_enabled: boolean;
  default_booking_deposit: number;
  allow_product_selection_bookings: boolean;
  booking_enabled: boolean;
}

export function BookingPaymentSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BookingPaymentSettingsData>({
    booking_payments_enabled: false,
    default_booking_deposit: 0,
    allow_product_selection_bookings: true,
    booking_enabled: false,
  });

  useEffect(() => {
    if (user?.id) {
      fetchSettings();
    }
  }, [user?.id]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('booking_payments_enabled, default_booking_deposit, allow_product_selection_bookings')
        .eq('id', user!.id)
        .single();

      // Check if user has any availability settings (indicates bookings are enabled)
      const { count: availabilityCount } = await supabase
        .from('availability_settings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      if (error) throw error;

      if (data) {
        setSettings({
          booking_payments_enabled: data.booking_payments_enabled || false,
          default_booking_deposit: data.default_booking_deposit || 0,
          allow_product_selection_bookings: data.allow_product_selection_bookings !== false,
          booking_enabled: (availabilityCount || 0) > 0,
        });
      }
    } catch (error) {
      console.error('Error fetching booking payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to load booking payment settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingToggle = async (enabled: boolean) => {
    if (!user?.id) return;

    try {
      if (enabled) {
        // Create default availability settings for all days
        const defaultSettings = [];
        for (let day = 0; day < 7; day++) {
          defaultSettings.push({
            user_id: user.id,
            day_of_week: day,
            start_time: '09:00',
            end_time: '17:00',
            is_available: day >= 1 && day <= 5, // Monday to Friday
          });
        }

        const { error } = await supabase
          .from('availability_settings')
          .upsert(defaultSettings, { onConflict: 'user_id,day_of_week' });

        if (error) throw error;
      } else {
        // Remove all availability settings
        const { error } = await supabase
          .from('availability_settings')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      }

      updateSetting('booking_enabled', enabled);
      
      toast({
        title: "Success",
        description: enabled 
          ? "Bookings enabled on your store with default availability." 
          : "Bookings disabled and removed from your store.",
      });
    } catch (error) {
      console.error('Error toggling bookings:', error);
      toast({
        title: "Error",
        description: "Failed to update booking settings.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          booking_payments_enabled: settings.booking_payments_enabled,
          default_booking_deposit: settings.default_booking_deposit,
          allow_product_selection_bookings: settings.allow_product_selection_bookings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking payment settings saved successfully.",
      });
    } catch (error) {
      console.error('Error saving booking payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to save booking payment settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof BookingPaymentSettingsData>(
    key: K,
    value: BookingPaymentSettingsData[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Booking Payment Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Booking Payment Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-4 p-4 border border-border rounded-lg bg-primary/5">
          <div className="space-y-0.5">
            <Label className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Enable Bookings on Store
            </Label>
            <p className="text-sm text-muted-foreground">
              Add booking functionality to your store with default availability
            </p>
          </div>
          <Switch
            checked={settings.booking_enabled}
            onCheckedChange={handleBookingToggle}
          />
        </div>

        {settings.booking_enabled && (
          <>
            <div className="flex items-center justify-between space-x-4 p-4 border border-border rounded-lg" data-walkthrough="booking-toggle">
              <div className="space-y-0.5">
                <Label className="font-medium">Enable Booking Payments</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to pay deposits or full amounts for bookings
                </p>
              </div>
              <Switch
                checked={settings.booking_payments_enabled}
                onCheckedChange={(checked) => updateSetting('booking_payments_enabled', checked)}
              />
            </div>
          </>
        )}

        {settings.booking_enabled && settings.booking_payments_enabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Default Booking Deposit Amount (ZAR)</Label>
              <Input
                id="deposit-amount"
                type="number"
                min="0"
                step="0.01"
                value={settings.default_booking_deposit}
                onChange={(e) => updateSetting('default_booking_deposit', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-sm text-muted-foreground">
                Default deposit amount when no products are selected. Set to 0 for full payment only.
              </p>
            </div>

            <div className="flex items-center justify-between space-x-4 p-4 border border-border rounded-lg">
              <div className="space-y-0.5">
                <Label className="font-medium">Allow Product Selection</Label>
                <p className="text-sm text-muted-foreground">
                  Let customers select products/services when making bookings
                </p>
              </div>
              <Switch
                checked={settings.allow_product_selection_bookings}
                onCheckedChange={(checked) => updateSetting('allow_product_selection_bookings', checked)}
              />
            </div>
          </>
        )}

        {settings.booking_enabled && (
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Payment Settings'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}