
-- Create the profiles table that the trigger expects
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  business_name text,
  full_name text,
  whatsapp_number text,
  store_bio text,
  logo_url text,
  store_handle text UNIQUE,
  store_address text,
  snapscan_link text,
  payfast_link text,
  eft_details text,
  store_layout text DEFAULT 'grid',
  store_font text DEFAULT 'inter',
  primary_color text DEFAULT '#4C9F70',
  accent_color text DEFAULT '#3d8159',
  header_banner_url text,
  hero_image_url text,
  hero_headline text,
  hero_subheading text,
  hero_cta_text text,
  hero_cta_link text,
  background_color text DEFAULT '#ffffff',
  theme_preset text DEFAULT 'clean',
  store_visibility boolean DEFAULT true,
  default_currency text DEFAULT 'ZAR',
  store_location text,
  delivery_note text,
  capitec_paylink text,
  show_capitec boolean DEFAULT false,
  payfast_merchant_id text,
  payfast_merchant_key text,
  payfast_passphrase text,
  payfast_mode text DEFAULT 'sandbox',
  payfast_billing_token text,
  trial_ends_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  has_active_subscription boolean DEFAULT false,
  subscription_price numeric DEFAULT 95.00,
  billing_start_date timestamp with time zone,
  discount_applied boolean DEFAULT false,
  cancelled_at timestamp with time zone,
  billing_failures integer DEFAULT 0,
  onboarding_completed boolean DEFAULT false,
  last_customized_at timestamp with time zone DEFAULT now(),
  customization_version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Public can view visible store profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (store_visibility = true);

CREATE POLICY "Anyone can view public store profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (store_handle IS NOT NULL AND store_handle <> '');

-- Create subscription_transactions table
CREATE TABLE public.subscription_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  amount numeric,
  reference text,
  payfast_payment_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Enable Row Level Security for subscription_transactions
ALTER TABLE public.subscription_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription_transactions
CREATE POLICY "Users can view their own subscription transactions" 
  ON public.subscription_transactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscription transactions" 
  ON public.subscription_transactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
