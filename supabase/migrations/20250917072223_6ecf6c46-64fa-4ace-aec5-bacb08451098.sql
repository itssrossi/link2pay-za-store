-- Create WhatsApp campaigns table
CREATE TABLE public.whatsapp_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_sid TEXT NOT NULL,
  delay_days INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create WhatsApp campaign subscribers table
CREATE TABLE public.whatsapp_campaign_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES public.whatsapp_campaigns(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- Create WhatsApp campaign logs table
CREATE TABLE public.whatsapp_campaign_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES public.whatsapp_campaign_subscribers(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaign_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaign_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for whatsapp_campaigns (admin only)
CREATE POLICY "Admin can manage WhatsApp campaigns" 
ON public.whatsapp_campaigns 
FOR ALL 
USING (true);

-- Create RLS policies for whatsapp_campaign_subscribers
CREATE POLICY "Users can view their own WhatsApp campaign subscriptions" 
ON public.whatsapp_campaign_subscribers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp campaign subscriptions" 
ON public.whatsapp_campaign_subscribers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for whatsapp_campaign_logs
CREATE POLICY "Users can view their own WhatsApp campaign logs" 
ON public.whatsapp_campaign_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM whatsapp_campaign_subscribers 
  WHERE whatsapp_campaign_subscribers.id = whatsapp_campaign_logs.subscriber_id 
  AND whatsapp_campaign_subscribers.user_id = auth.uid()
));

-- Create triggers for updated_at columns
CREATE TRIGGER update_whatsapp_campaigns_updated_at
BEFORE UPDATE ON public.whatsapp_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_campaign_subscribers_updated_at
BEFORE UPDATE ON public.whatsapp_campaign_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 3 WhatsApp campaigns
INSERT INTO public.whatsapp_campaigns (name, template_sid, delay_days, is_active) VALUES
('Welcome Message', 'HX39926c4ec0002acb1759214551a124bf', 0, true),
('Day 2 Follow-up', 'HX2973816c29702639cfde203d4cbd00e0', 2, true),
('Day 4 Check-in', 'HXc50498daf8a62e84dc21d8c0572e4cdd', 4, true);

-- Create function to enroll user in WhatsApp campaigns
CREATE OR REPLACE FUNCTION public.enroll_user_in_whatsapp_campaigns(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Enroll user in all active WhatsApp campaigns
  INSERT INTO public.whatsapp_campaign_subscribers (user_id, campaign_id, scheduled_at)
  SELECT 
    p_user_id,
    wc.id,
    now() + (wc.delay_days || ' days')::INTERVAL
  FROM public.whatsapp_campaigns wc
  WHERE wc.is_active = true
  ON CONFLICT (user_id, campaign_id) DO NOTHING;
END;
$function$;