import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { OnboardingState } from '../NewOnboardingContainer';

interface AvailabilityStepProps {
  onNext: () => void;
  state: OnboardingState;
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
  isOptional: boolean;
}

interface DayAvailability {
  dayOfWeek: number;
  dayName: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

const AvailabilityStep: React.FC<AvailabilityStepProps> = ({ onNext, state, setState }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<DayAvailability[]>([
    { dayOfWeek: 1, dayName: 'Monday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 2, dayName: 'Tuesday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 3, dayName: 'Wednesday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 4, dayName: 'Thursday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 5, dayName: 'Friday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 6, dayName: 'Saturday', isAvailable: false, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 0, dayName: 'Sunday', isAvailable: false, startTime: '09:00', endTime: '17:00' },
  ]);

  useEffect(() => {
    loadExistingAvailability();
  }, [user]);

  const loadExistingAvailability = async () => {
    if (!user) return;

    try {
      const { data: existingAvailability } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('user_id', user.id);

      if (existingAvailability && existingAvailability.length > 0) {
        setAvailability(prev => prev.map(day => {
          const existing = existingAvailability.find(a => a.day_of_week === day.dayOfWeek);
          if (existing) {
            return {
              ...day,
              isAvailable: existing.is_available,
              startTime: existing.start_time,
              endTime: existing.end_time
            };
          }
          return day;
        }));
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const updateDay = (index: number, updates: Partial<DayAvailability>) => {
    setAvailability(prev => prev.map((day, i) => 
      i === index ? { ...day, ...updates } : day
    ));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Delete existing availability
      await supabase
        .from('availability_settings')
        .delete()
        .eq('user_id', user.id);

      // Insert new availability
      const availabilityData = availability.map(day => ({
        user_id: user.id,
        day_of_week: day.dayOfWeek,
        is_available: day.isAvailable,
        start_time: day.startTime,
        end_time: day.endTime
      }));

      const { error } = await supabase
        .from('availability_settings')
        .insert(availabilityData);

      if (error) throw error;

      setState(prev => ({ ...prev, hasAvailability: true }));
      toast.success('Availability saved successfully!');
      onNext();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const hasAtLeastOneAvailableDay = availability.some(day => day.isAvailable);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center px-4 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
          Set Your Availability
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Choose the days and times when customers can book appointments with you.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          {availability.map((day, index) => (
            <div key={day.dayOfWeek} className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={day.isAvailable}
                    onCheckedChange={(checked) => updateDay(index, { isAvailable: checked })}
                  />
                  <Label className="font-medium text-sm sm:text-base">{day.dayName}</Label>
                </div>
              </div>
              
              {day.isAvailable && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 pl-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => updateDay(index, { startTime: e.target.value })}
                      className="w-28 sm:w-32 text-sm min-h-[44px]"
                    />
                  </div>
                  <span className="text-muted-foreground text-sm hidden sm:inline">to</span>
                  <span className="text-muted-foreground text-sm sm:hidden">until</span>
                  <Input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => updateDay(index, { endTime: e.target.value })}
                    className="w-28 sm:w-32 text-sm min-h-[44px]"
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="text-center px-4 sm:px-0">
        <Button
          onClick={handleSave}
          disabled={saving || !hasAtLeastOneAvailableDay}
          size="lg"
          className="min-h-[44px] w-full sm:w-auto sm:min-w-40"
        >
          {saving ? 'Saving...' : 'Save & Continue'}
        </Button>
        {!hasAtLeastOneAvailableDay && (
          <p className="text-xs sm:text-sm text-red-500 mt-2">
            Please select at least one available day
          </p>
        )}
      </div>
    </div>
  );
};

export default AvailabilityStep;