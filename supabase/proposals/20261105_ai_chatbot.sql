-- Review and apply after 20261103_ai_mvp.sql on a backed-up development database.
-- Daily quota uses UTC dates and is enforced atomically per authenticated user.
create table public.ai_chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  request_count integer not null default 0 check (request_count between 0 and 30),
  primary key (user_id, usage_date)
);
alter table public.ai_chat_usage enable row level security;
revoke all on public.ai_chat_usage from anon, authenticated;

create or replace function public.increment_chat_usage()
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user_id uuid := auth.uid();
declare v_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  insert into public.ai_chat_usage (user_id, usage_date, request_count)
  values (v_user_id, (now() at time zone 'UTC')::date, 1)
  on conflict (user_id, usage_date) do update
    set request_count = public.ai_chat_usage.request_count + 1
    where public.ai_chat_usage.request_count < 30
  returning request_count into v_count;
  return v_count is not null;
end $$;
revoke all on function public.increment_chat_usage() from public, anon;
grant execute on function public.increment_chat_usage() to authenticated;
