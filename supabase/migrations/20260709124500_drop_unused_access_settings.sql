-- Remove unused pre-launch access/config tables.
-- Recreate these later only when the product flow is clear.

drop table if exists public.access_whitelist;
drop table if exists public.site_settings;
