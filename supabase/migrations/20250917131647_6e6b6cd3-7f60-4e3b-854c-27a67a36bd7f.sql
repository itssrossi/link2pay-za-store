-- Create detailed onboarding progress tracking table
CREATE TABLE public.onboarding_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  step_name TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  onboarding_type TEXT, -- 'physical_products' or 'bookings'
  entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  skipped_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER,
  is_completed BOOLEAN DEFAULT false,
  is_skipped BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own onboarding progress" 
ON public.onboarding_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own onboarding progress" 
ON public.onboarding_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress" 
ON public.onboarding_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_onboarding_progress_user_step ON public.onboarding_progress(user_id, step_name);
CREATE INDEX idx_onboarding_progress_user_created ON public.onboarding_progress(user_id, created_at);

-- Create trigger for updating timestamps
CREATE TRIGGER update_onboarding_progress_updated_at
BEFORE UPDATE ON public.onboarding_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();