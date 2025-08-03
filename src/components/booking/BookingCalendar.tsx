import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, isSameDay } from 'date-fns';
import { toast } from 'sonner';

interface BookingCalendarProps {
  userId: string;
  onTimeSlotSelect: (date: Date, time: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
  refreshKey?: number;
}

interface TimeSlot {
  time: string;
  isBooked: boolean;
  bookingId?: string;
}

interface AvailabilitySettings {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  userId,
  onTimeSlotSelect,
  selectedDate,
  selectedTime,
  refreshKey
}) => {
  const [date, setDate] = useState<Date | undefined>(selectedDate || new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySettings[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch availability settings
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const { data, error } = await supabase
          .from('availability_settings')
          .select('*')
          .eq('user_id', userId)
          .eq('is_available', true);

        if (error) throw error;
        setAvailability(data || []);
      } catch (error) {
        console.error('Error fetching availability:', error);
      }
    };

    fetchAvailability();
  }, [userId]);

  // Generate time slots for selected date - refreshKey triggers refresh after booking
  useEffect(() => {
    if (!date || availability.length === 0) return;

    const generateTimeSlots = async () => {
      setLoading(true);
      try {
        console.log('BookingCalendar: Generating time slots for date:', format(date, 'yyyy-MM-dd'), 'refreshKey:', refreshKey);
        
        const dayOfWeek = date.getDay();
        const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);

        if (dayAvailability.length === 0) {
          console.log('No availability for day:', dayOfWeek);
          setAvailableSlots([]);
          setLoading(false);
          return;
        }

        // Get existing bookings for this date
        const { data: bookings, error: bookingsError } = await supabase
          .from('booking_time_slots')
          .select('time_slot, is_booked, booking_id')
          .eq('user_id', userId)
          .eq('date', format(date, 'yyyy-MM-dd'));

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
          throw bookingsError;
        }

        console.log('Fetched bookings for date:', format(date, 'yyyy-MM-dd'), bookings);

        const slots: TimeSlot[] = [];
        
        dayAvailability.forEach(avail => {
          const startTime = new Date(`2000-01-01T${avail.start_time}`);
          const endTime = new Date(`2000-01-01T${avail.end_time}`);
          
          // Generate 1-hour slots
          for (let time = new Date(startTime); time < endTime; time.setHours(time.getHours() + 1)) {
            const timeString = format(time, 'HH:mm');
            const existingBooking = bookings?.find(b => b.time_slot === timeString);
            
            slots.push({
              time: timeString,
              isBooked: existingBooking?.is_booked || false,
              bookingId: existingBooking?.booking_id
            });
          }
        });

        console.log('Generated slots for display:', slots);
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Error generating time slots:', error);
        toast.error('Failed to load available time slots');
      } finally {
        setLoading(false);
      }
    };

    generateTimeSlots();
  }, [date, availability, userId, refreshKey]);

  const handleTimeSlotClick = (timeSlot: TimeSlot) => {
    if (timeSlot.isBooked || !date) return;
    onTimeSlotSelect(date, timeSlot.time);
  };

  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    return availability.some(a => a.day_of_week === dayOfWeek && a.is_available);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today || !isDateAvailable(date);
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {date && (
        <Card>
          <CardHeader>
            <CardTitle>Available Times - {format(date, 'EEEE, MMMM do')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading available times...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No available times for this date
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    variant={
                      selectedTime === slot.time && isSameDay(date, selectedDate || new Date())
                        ? "default"
                        : slot.isBooked
                        ? "secondary"
                        : "outline"
                    }
                    disabled={slot.isBooked}
                    onClick={() => handleTimeSlotClick(slot)}
                    className="relative"
                  >
                    {slot.time}
                    {slot.isBooked && (
                      <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs">
                        Booked
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingCalendar;