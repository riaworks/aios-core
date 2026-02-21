---
trigger: supabase
---
# Supabase Context Rules

- Always use RLS policies for data access control
- Check existing migrations before making schema changes
- Use service role key only in server-side code, never expose in client
- Prefer `supabase.from()` with typed generics over raw SQL
- Run `supabase db push` to apply migrations, never edit production schema directly
