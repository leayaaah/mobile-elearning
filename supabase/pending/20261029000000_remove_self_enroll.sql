-- PENDING: do not run before checkout_cart() has been verified.
-- Move this file into supabase/migrations/ only when the release decision is made.

drop policy if exists "insert own enrollments" on public.enrollments;
