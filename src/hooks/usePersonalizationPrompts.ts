import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PersonalizationPromptsState {
  showLogoPrompt: boolean;
  showProductsPrompt: boolean;
  showQuickInvoicePrompt: boolean;
  dismissLogoPrompt: () => Promise<void>;
  dismissProductsPrompt: () => Promise<void>;
  dismissQuickInvoicePrompt: () => Promise<void>;
  loading: boolean;
}

export const usePersonalizationPrompts = (): PersonalizationPromptsState => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showLogoPrompt, setShowLogoPrompt] = useState(false);
  const [showProductsPrompt, setShowProductsPrompt] = useState(false);
  const [showQuickInvoicePrompt, setShowQuickInvoicePrompt] = useState(false);

  const checkPromptConditions = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all required data in parallel
      const [profileResult, productsResult, invoicesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('logo_url, store_handle, whatsapp_number, dashboard_visit_count, prompt_logo_dismissed, prompt_products_dismissed, prompt_quick_invoice_dismissed, quick_invoice_used')
          .eq('id', user.id)
          .single(),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ]);

      const profile = profileResult.data;
      const productsCount = productsResult.count || 0;
      const invoicesCount = invoicesResult.count || 0;

      if (!profile) return;

      // Logo Prompt Logic
      const shouldShowLogoPrompt = 
        !profile.logo_url && 
        !profile.prompt_logo_dismissed &&
        (profile.dashboard_visit_count || 0) >= 2 &&
        (productsCount > 0 || invoicesCount > 0);

      // Products Prompt Logic
      const shouldShowProductsPrompt = 
        productsCount < 3 &&
        !profile.prompt_products_dismissed &&
        !!profile.store_handle &&
        (profile.dashboard_visit_count || 0) >= 1;

      // Quick Invoice Prompt Logic
      const shouldShowQuickInvoicePrompt = 
        invoicesCount > 0 &&
        !profile.quick_invoice_used &&
        !profile.prompt_quick_invoice_dismissed &&
        !!profile.whatsapp_number;

      setShowLogoPrompt(shouldShowLogoPrompt);
      setShowProductsPrompt(shouldShowProductsPrompt);
      setShowQuickInvoicePrompt(shouldShowQuickInvoicePrompt);

    } catch (error) {
      console.error('Error checking prompt conditions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkPromptConditions();
  }, [checkPromptConditions]);

  const dismissLogoPrompt = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ prompt_logo_dismissed: true })
      .eq('id', user.id);
    setShowLogoPrompt(false);
  }, [user]);

  const dismissProductsPrompt = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ prompt_products_dismissed: true })
      .eq('id', user.id);
    setShowProductsPrompt(false);
  }, [user]);

  const dismissQuickInvoicePrompt = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ prompt_quick_invoice_dismissed: true })
      .eq('id', user.id);
    setShowQuickInvoicePrompt(false);
  }, [user]);

  return {
    showLogoPrompt,
    showProductsPrompt,
    showQuickInvoicePrompt,
    dismissLogoPrompt,
    dismissProductsPrompt,
    dismissQuickInvoicePrompt,
    loading
  };
};