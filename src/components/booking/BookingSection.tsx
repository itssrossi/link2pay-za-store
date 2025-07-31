import React, { useState } from 'react';
import BookingCalendar from './BookingCalendar';
import BookingForm from './BookingForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BookingSectionProps {
  userId: string;
  businessName?: string;
  isOwner?: boolean;
}

const BookingSection: React.FC<BookingSectionProps> = ({ 
  userId, 
  businessName = 'Business',
  isOwner = false 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [showBookingForm, setShowBookingForm] = useState(false);

  const handleTimeSlotSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowBookingForm(true);
  };

  const handleBookingComplete = () => {
    setShowBookingForm(false);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
  };

  const handleCancel = () => {
    setShowBookingForm(false);
  };

  if (isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Calendar Preview</CardTitle>
          <p className="text-sm text-muted-foreground">
            This is how customers will see your booking calendar. Configure your availability in Settings.
          </p>
        </CardHeader>
        <CardContent>
          <BookingCalendar
            userId={userId}
            onTimeSlotSelect={() => {}} // No-op for owner preview
            selectedDate={selectedDate}
            selectedTime={selectedTime}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Book an Appointment</CardTitle>
          <p className="text-sm text-muted-foreground">
            Schedule your appointment with {businessName}
          </p>
        </CardHeader>
      </Card>

      {!showBookingForm ? (
        <BookingCalendar
          userId={userId}
          onTimeSlotSelect={handleTimeSlotSelect}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />
      ) : (
        selectedDate && selectedTime && (
          <BookingForm
            userId={userId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onBookingComplete={handleBookingComplete}
            onCancel={handleCancel}
          />
        )
      )}
    </div>
  );
};

export default BookingSection;