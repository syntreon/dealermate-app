-- Create call_logs table to replace Google Sheets integration
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone_number TEXT,
  appointment_date DATE,
  appointment_time TIME,
  details TEXT,
  status TEXT,
  disposition TEXT,
  new_appointment_time TEXT,
  notes TEXT,
  call_time TIMESTAMP WITH TIME ZONE,
  call_recording_url TEXT,
  error_logs TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS call_logs_customer_name_idx ON public.call_logs (customer_name);
CREATE INDEX IF NOT EXISTS call_logs_status_idx ON public.call_logs (status);
CREATE INDEX IF NOT EXISTS call_logs_appointment_date_idx ON public.call_logs (appointment_date);
CREATE INDEX IF NOT EXISTS call_logs_created_by_idx ON public.call_logs (created_by);

-- Enable Row Level Security
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for call_logs table
CREATE POLICY "Users can view all call logs"
  ON public.call_logs
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own call logs"
  ON public.call_logs
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own call logs"
  ON public.call_logs
  FOR UPDATE
  USING (created_by = auth.uid() OR 
    (SELECT is_admin FROM public.users WHERE id = auth.uid())
  );

-- Create function to get recent call logs
CREATE OR REPLACE FUNCTION public.get_recent_call_logs(limit_count INTEGER DEFAULT 10)
RETURNS SETOF public.call_logs AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.call_logs
  ORDER BY created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get call logs by status
CREATE OR REPLACE FUNCTION public.get_call_logs_by_status(status_value TEXT)
RETURNS SETOF public.call_logs AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.call_logs
  WHERE status = status_value
  ORDER BY appointment_date ASC, appointment_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
