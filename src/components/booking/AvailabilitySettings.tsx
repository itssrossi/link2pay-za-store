import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BookingPaymentSettings } from './BookingPaymentSettings';
import { CompletionPopup } from '@/components/ui/completion-popup';
import { triggerConfetti } from '@/components/ui/confetti';

interface AvailabilitySetting {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

const AvailabilitySettings: React.FC = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<AvailabilitySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [hasExistingAvailability, setHasExistingAvailability] = useState(false);

  // Helper function to format time from HH:MM:SS to HH:MM
  const formatTimeForDisplay = (timeString: string) => {
    if (!timeString) return timeString;
    return timeString.substring(0, 5); // Convert "09:00:00" to "09:00"
  };

  useEffect(() => {
    fetchAvailability();
  }, [user]);

  const fetchAvailability = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week');

      if (error) throw error;

      // Track if user had existing availability settings
      const hasExisting = data && data.length > 0;
      setHasExistingAvailability(hasExisting);

      // If no availability settings exist, create default ones
      if (!hasExisting) {
        const defaultSettings = DAYS_OF_WEEK.map(day => ({
          day_of_week: day.value,
          start_time: '09:00',
          end_time: '17:00',
          is_available: day.value >= 1 && day.value <= 5 // Monday to Friday
        }));
        setAvailability(defaultSettings);
      } else {
        // Format times from database (HH:MM:SS) to display format (HH:MM)
        const formattedData = data.map(setting => ({
          ...setting,
          start_time: formatTimeForDisplay(setting.start_time),
          end_time: formatTimeForDisplay(setting.end_time)
        }));
        console.log('Formatted availability data:', formattedData); // Debug log
        setAvailability(formattedData);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = (dayOfWeek: number, field: keyof AvailabilitySetting, value: any) => {
    setAvailability(prev => 
      prev.map(item => 
        item.day_of_week === dayOfWeek 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleSave = async () => {
    if (!user) return;

    const isFirstTimeSetup = !hasExistingAvailability;
    setSaving(true);
    try {
      // Delete existing settings
      await supabase
        .from('availability_settings')
        .delete()
        .eq('user_id', user.id);

      // Insert new settings
      const settingsToInsert = availability.map(setting => ({
        user_id: user.id,
        day_of_week: setting.day_of_week,
        start_time: setting.start_time,
        end_time: setting.end_time,
        is_available: setting.is_available
      }));

      const { data: insertedData, error } = await supabase
        .from('availability_settings')
        .insert(settingsToInsert)
        .select();

      if (error) throw error;

      // Update state immediately with the inserted data
      if (insertedData) {
        const formattedInsertedData = insertedData.map(setting => ({
          ...setting,
          start_time: formatTimeForDisplay(setting.start_time),
          end_time: formatTimeForDisplay(setting.end_time)
        }));
        console.log('Formatted inserted data:', formattedInsertedData); // Debug log
        setAvailability(formattedInsertedData);
      }

      // Only show completion popup and confetti on first-time setup
      if (isFirstTimeSetup) {
        triggerConfetti();
        setShowCompletionPopup(true);
      }
      
      toast.success('Availability settings saved successfully');
      
      // Update the tracking state
      setHasExistingAvailability(true);
      
      // Wait a moment then refresh to ensure everything is synced
      setTimeout(async () => {
        await fetchAvailability();
      }, 200);
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading availability settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Set Your Availability</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure when customers can book appointments with you
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {DAYS_OF_WEEK.map(day => {
            const setting = availability.find(a => a.day_of_week === day.value) || {
              day_of_week: day.value,
              start_time: '09:00',
              end_time: '17:00',
              is_available: false
            };

            return (
              <div key={day.value} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <Switch
                    checked={setting.is_available}
                    onCheckedChange={(checked) => 
                      updateAvailability(day.value, 'is_available', checked)
                    }
                  />
                  <Label className="font-medium min-w-[80px]">{day.label}</Label>
                </div>
                
                {setting.is_available && (
                  <div className="flex items-center space-x-2 ml-auto">
                    <Select
                      value={setting.start_time}
                      onValueChange={(value) => 
                        updateAvailability(day.value, 'start_time', value)
                      }
                    >
                      <SelectTrigger className="w-20 sm:w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <span className="text-muted-foreground text-xs sm:text-sm">to</span>
                    
                    <Select
                      value={setting.end_time}
                      onValueChange={(value) => 
                        updateAvailability(day.value, 'end_time', value)
                      }
                    >
                      <SelectTrigger className="w-20 sm:w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          })}
          
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Availability Settings'}
          </Button>
        </CardContent>
      </Card>

      <BookingPaymentSettings />
      
      <CompletionPopup
        isOpen={showCompletionPopup}
        onClose={() => setShowCompletionPopup(false)}
        title="Availability Settings Saved!"
        message="Click the dashboard button to complete the rest of the steps"
      />
    </div>
  );
};

export default AvailabilitySettings;