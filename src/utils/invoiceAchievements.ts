import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { triggerConfetti } from '@/components/ui/confetti';
import { playCelebrationSound } from '@/utils/celebrationSound';

export const checkWeeklyInvoiceAchievement = async (userId: string): Promise<void> => {
  try {
    // Get start of current week (Monday 00:00)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);

    // Count invoices this week
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monday.toISOString());

    if (error) throw error;

    // Show achievement on milestone numbers (3, 6, 9, ...)
    if (count && count > 0 && count % 3 === 0) {
      triggerConfetti();
      playCelebrationSound();
      
      toast.success(
        `You're on a roll — ${count} invoices this week 🎉`,
        {
          duration: 5000,
        }
      );
    }
  } catch (error) {
    console.error('Error checking weekly achievements:', error);
    // Silent fail - don't disrupt user flow
  }
};
