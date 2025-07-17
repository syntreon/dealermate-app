-- Initial schema for the forked app
-- This will create the necessary tables and functions for your Supabase project

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_by UUID REFERENCES public.users(id)
);

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for users table
CREATE POLICY "Users can view all users"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (
    (SELECT is_admin FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own record"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() OR 
    (SELECT is_admin FROM public.users WHERE id = auth.uid())
  );

-- Create policy for app_settings table
CREATE POLICY "Anyone can view app settings"
  ON public.app_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify app settings"
  ON public.app_settings
  FOR ALL
  USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid())
  );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT is_admin FROM public.users WHERE id = user_id
$$ LANGUAGE SQL SECURITY DEFINER;

-- Create function to create a user with auth
CREATE OR REPLACE FUNCTION public.create_user_with_auth(
  user_email TEXT,
  user_password TEXT,
  user_name TEXT,
  user_phone TEXT,
  user_is_admin BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- This function assumes you'll handle the auth.users creation via Supabase Auth API
  -- and then use the returned UUID to create the public.users record
  
  -- For now, just return a placeholder
  RETURN '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default app settings
INSERT INTO public.app_settings (id, description, value)
VALUES 
  ('webhook_url', 'Webhook URL for call notifications', NULL)
ON CONFLICT (id) DO NOTHING;
