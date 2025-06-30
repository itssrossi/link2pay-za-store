import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Building2, Target, MapPin } from 'lucide-react';

const formSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  businessCategory: z.string().min(1, 'Please select a business category'),
  businessOffer: z.string().min(10, 'Please describe what your business offers (at least 10 characters)'),
  monthlyRevenue: z.array(z.number()).length(1),
  growthGoals: z.string().min(10, 'Please describe your growth goals (at least 10 characters)'),
  businessLocation: z.string().min(2, 'Please enter your business location'),
});

type FormData = z.infer<typeof formSchema>;

interface GrowthApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const GrowthApplicationForm = ({ isOpen, onClose }: GrowthApplicationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      businessCategory: '',
      businessOffer: '',
      monthlyRevenue: [10000],
      growthGoals: '',
      businessLocation: '',
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const onSubmit = async (data: FormData) => {
    console.log('🚀 Growth Application Form Submission Started');
    console.log('📋 Form Data:', data);
    
    setIsSubmitting(true);
    
    try {
      // Test Supabase connection first
      console.log('🔍 Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase connection test failed:', testError);
        throw new Error(`Supabase connection failed: ${testError.message}`);
      }
      
      console.log('✅ Supabase connection successful');

      const formattedData = {
        ...data,
        monthlyRevenue: data.monthlyRevenue[0],
      };

      console.log('📤 Sending data to edge function:', formattedData);
      console.log('🌐 Supabase URL:', 'https://mpzqlidtvlbijloeusuj.supabase.co');

      const { data: response, error } = await supabase.functions.invoke('send-growth-application', {
        body: formattedData,
      });

      console.log('📨 Edge function response:', response);
      console.log('❌ Edge function error:', error);

      if (error) {
        console.error('💥 Edge function error details:', {
          message: error.message,
          context: error.context,
          details: error.context?.body || error.context?.response
        });
        throw new Error(`Edge function failed: ${error.message}`);
      }

      console.log('✅ Application submitted successfully!');
      setIsSuccess(true);
      form.reset();
      toast.success('Application submitted successfully!');
      
    } catch (error) {
      console.error('💥 Complete error details:', error);
      console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack available');
      
      let errorMessage = 'Failed to submit application. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    form.reset();
    onClose();
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-green-800">
              Application Submitted!
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Thanks for applying! Our team will review your business and contact you within 48 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <Button onClick={handleClose} className="w-full bg-[#4C9F70] hover:bg-[#3d7a59]">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <img 
              src="/lovable-uploads/e6db2000-16be-4362-bb02-9bb7800e39bd.png" 
              alt="Link2Pay" 
              className="h-10 w-auto"
            />
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Apply to Scale Your Business
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                with Our Marketing Team
              </DialogDescription>
            </div>
          </div>
          <div className="bg-gradient-to-r from-[#4C9F70] to-[#3d7a59] rounded-lg p-4 text-white mt-4">
            <p className="text-sm leading-relaxed">
              Want to grow your sales, reach more customers, and scale your business online?
              Apply for our hands-on growth system — we'll help you run ads, build funnels, and grow revenue.
            </p>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4" />
                      <span>Business Name</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your business name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beauty">Beauty</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Business Location</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="City, Province" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="businessOffer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What does your business offer?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your products or services in detail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthlyRevenue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Monthly Revenue</FormLabel>
                  <div className="space-y-3">
                    <FormControl>
                      <Slider
                        min={0}
                        max={500000}
                        step={5000}
                        value={field.value}
                        onValueChange={field.onChange}
                        className="w-full"
                      />
                    </FormControl>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>R0</span>
                      <span className="font-medium text-[#4C9F70]">
                        {formatCurrency(field.value[0])}
                      </span>
                      <span>R500,000+</span>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="growthGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>What are your growth goals?</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your growth objectives, target revenue, expansion plans..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#4C9F70] hover:bg-[#3d7a59]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GrowthApplicationForm;
