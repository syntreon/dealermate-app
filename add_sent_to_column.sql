-- Add sent_to column to leads table
ALTER TABLE public.leads ADD COLUMN sent_to TEXT;

-- If you need to update existing records with email data
-- UPDATE public.leads SET sent_to = email WHERE email IS NOT NULL;

-- Note: The sent_to_client_at column already exists in the database
-- and will be used for the "Sent at" information in the Updates card
