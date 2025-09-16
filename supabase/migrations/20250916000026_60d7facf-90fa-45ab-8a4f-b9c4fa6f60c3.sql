-- Create email campaigns table
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_content TEXT NOT NULL,
  delay_days INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email campaign subscribers table
CREATE TABLE public.email_campaign_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id),
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'sent', 'failed', 'unsubscribed')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- Create email campaign logs table
CREATE TABLE public.email_campaign_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES public.email_campaign_subscribers(id),
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'bounced', 'failed', 'opened', 'clicked')),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin can manage email campaigns" ON public.email_campaigns FOR ALL USING (true);
CREATE POLICY "Users can view their own campaign subscriptions" ON public.email_campaign_subscribers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own campaign subscriptions" ON public.email_campaign_subscribers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own campaign logs" ON public.email_campaign_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.email_campaign_subscribers WHERE id = subscriber_id AND user_id = auth.uid()));

-- Insert the 3 drip campaign templates
INSERT INTO public.email_campaigns (name, subject, template_content, delay_days) VALUES 
('welcome_day_0', 'You''re 1 step away from getting paid 🎉', 'Hi {{name}},

Welcome to Link2Pay 👋 — let''s get you paid today.

Here''s your 3-step checklist (takes <5 min):
1️⃣ Add your first product/service
2️⃣ Share your Link2Pay link on WhatsApp
3️⃣ Watch payments come in 💸

👉 www.Link2pay.co.za

Most new businesses send their first invoice in under 24 hours. Let''s make sure you''re one of them.

See you inside,
The Link2Pay Team', 0),

('social_proof_day_2', 'Other businesses are already cashing in with Link2Pay', 'Hi {{name}},

I don''t want you to miss this →
In the last 48 hours, businesses collected thousands using Link2Pay.

The only difference between them and you? They finished onboarding.

Don''t let money sit on the table. Click below, send your first invoice, and see cash flow today:

👉 www.Link2pay.co.za

You''ve got this 💪
The Link2Pay Team', 2),

('urgency_day_5', 'Don''t let your trial run out before you get paid', 'Hi {{name}},

Your free trial is almost over — just 2 days left.

Now''s the best time to finish setting up and send your first invoice so you can experience how simple it is to get paid with Link2Pay.

👉 www.Link2pay.co.za

You''re closer than you think. Let''s make sure you see your first payment before the trial ends.

Cheers,
The Link2Pay Team', 5);

-- Create trigger for updated_at columns
CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_campaign_subscribers_updated_at
  BEFORE UPDATE ON public.email_campaign_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to enroll user in drip campaigns
CREATE OR REPLACE FUNCTION public.enroll_user_in_drip_campaigns(p_user_id UUID)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;