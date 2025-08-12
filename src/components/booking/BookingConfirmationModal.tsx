import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    bookingDate: Date;
    bookingTime: string;
    notes?: string;
  };
  storeLocation?: string;
}

export const BookingConfirmationModal = ({
  isOpen,
  onClose,
  bookingData,
  storeLocation
}: BookingConfirmationModalProps) => {
  const formattedDate = format(bookingData.bookingDate, 'dd MMMM yyyy');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            ✅ Thank You for Your Booking!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2 text-sm">
            <div><strong>Name:</strong> {bookingData.customerName}</div>
            <div><strong>Date:</strong> {formattedDate}</div>
            <div><strong>Time:</strong> {bookingData.bookingTime}</div>
            {storeLocation && (
              <div><strong>Location:</strong> {storeLocation}</div>
            )}
          </div>
          
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            We look forward to seeing you!
            <br />
            Please arrive on time for your appointment.
          </div>
        </div>
        
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};