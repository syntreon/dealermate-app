-- Add preferences column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'preferences'
  ) THEN
    ALTER TABLE public.users ADD COLUMN preferences JSONB DEFAULT '{
      "notifications": {
        "email": true,
        "leadAlerts": true,
        "systemAlerts": true,
        "notificationEmails": []
      },
      "displaySettings": {
        "theme": "dark",
        "dashboardLayout": "detailed"
      }
    }'::jsonb;
    
    -- Add comment to the column
    COMMENT ON COLUMN public.users.preferences IS 'User preferences including notification settings and display preferences';
  END IF;
END $$;
