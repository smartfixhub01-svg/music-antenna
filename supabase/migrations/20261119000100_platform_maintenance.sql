-- Music Antenna: Platform Maintenance Mode

-- Create the setting only if it does not already exist.
-- This preserves the current live ON/OFF value.
INSERT INTO public.platform_settings (setting_key, setting_value)
VALUES (
  'platform.maintenance',
  '{"enabled": false}'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

-- Allow authenticated users to read only the maintenance setting.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_settings'
      AND policyname = 'Authenticated users can read maintenance status'
  ) THEN
    CREATE POLICY "Authenticated users can read maintenance status"
      ON public.platform_settings
      FOR SELECT
      TO authenticated
      USING (setting_key = 'platform.maintenance');
  END IF;
END
$$;

-- Ensure authenticated users have table-level SELECT permission.
GRANT SELECT ON public.platform_settings TO authenticated;
