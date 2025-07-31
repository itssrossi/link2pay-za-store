import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

      // If no availability settings exist, create default ones
      if (!data || data.length === 0) {
        const defaultSettings = DAYS_OF_WEEK.map(day => ({
          day_of_week: day.value,
          start_time: '09:00',
          end_time: '17:00',
          is_available: day.value >= 1 && day.value <= 5 // Monday to Friday
        }));
        setAvailability(defaultSettings);
      } else {
        setAvailability(data);
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

      const { error } = await supabase
        .from('availability_settings')
        .insert(settingsToInsert);

      if (error) throw error;

      toast.success('Availability settings saved successfully');
      fetchAvailability(); // Refresh to get IDs
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
            <div key={day.value} className="flex items-center justify-between p-4 border rounded-lg">
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
                <div className="flex items-center space-x-2">
                  <Select
                    value={setting.start_time}
                    onValueChange={(value) => 
                      updateAvailability(day.value, 'start_time', value)
                    }
                  >
                    <SelectTrigger className="w-24">
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
                  
                  <span className="text-muted-foreground">to</span>
                  
                  <Select
                    value={setting.end_time}
                    onValueChange={(value) => 
                      updateAvailability(day.value, 'end_time', value)
                    }
                  >
                    <SelectTrigger className="w-24">
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
  );
};

export default AvailabilitySettings;