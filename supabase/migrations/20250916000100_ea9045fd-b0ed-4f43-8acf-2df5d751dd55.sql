-- Fix security warning: Set search_path for the drip campaigns function
CREATE OR REPLACE FUNCTION public.enroll_user_in_drip_campaigns(p_user_id UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Enroll user in all active campaigns
  INSERT INTO public.email_campaign_subscribers (user_id, campaign_id, scheduled_at)
  SELECT 
    p_user_id,
    ec.id,
    now() + (ec.delay_days || ' days')::INTERVAL
  FROM public.email_campaigns ec
  WHERE ec.is_active = true
  ON CONFLICT (user_id, campaign_id) DO NOTHING;
END;
$$;