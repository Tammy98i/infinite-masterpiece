# Supabase production setup

The application uses Supabase Auth as its production identity provider. Apply `profiles.sql` in the Supabase SQL Editor before publishing; it creates the profile table, RLS policies, privileged-field protection, and signup trigger.

Production requires these server variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Keep the service-role key out of browser variables. Configure the final published hostname in Supabase Authentication → URL Configuration before launch. The current Express content store remains SQLite until its synchronous data services are migrated; Supabase is authoritative for authentication and profiles.
