-- PROPOSAL ONLY. Do not run before reviewing the live schema and backing it up.
-- Apply after 20261103_ai_mvp.sql and 20261105_fix_recommend_ai_courses_ambiguity.sql.
-- Run this file as one transaction. Existing user_events rows are retained.
begin;

alter table public.profiles
  add column if not exists tracking_consent boolean,
  add column if not exists tracking_consent_at timestamptz;

-- RLS limits rows, not columns. Replace table-level UPDATE with column grants.
-- This also prevents changing id and created_at through the client.
revoke update on public.profiles from public, anon, authenticated;
grant update (full_name, headline, avatar_url, cover_url) on public.profiles to authenticated;

create or replace function public.has_tracking_consent(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_user_id = auth.uid() and coalesce((
    select p.tracking_consent from public.profiles p where p.id = p_user_id
  ), false);
$$;
revoke all on function public.has_tracking_consent(uuid) from public, anon, authenticated;
grant execute on function public.has_tracking_consent(uuid) to authenticated;

create or replace function public.set_tracking_consent(p_granted boolean)
returns table(tracking_consent boolean, tracking_consent_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_granted is null then raise exception 'Consent must be true or false'; end if;
  return query
    update public.profiles p
    set tracking_consent = p_granted, tracking_consent_at = now()
    where p.id = auth.uid()
    returning p.tracking_consent, p.tracking_consent_at;
  if not found then raise exception 'Profile not found'; end if;
end $$;
revoke all on function public.set_tracking_consent(boolean) from public, anon, authenticated;
grant execute on function public.set_tracking_consent(boolean) to authenticated;

create or replace function public.delete_my_tracking_data()
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare v_count bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.user_events where user_id = auth.uid();
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function public.delete_my_tracking_data() from public, anon, authenticated;
grant execute on function public.delete_my_tracking_data() to authenticated;

drop policy if exists "insert own view only" on public.user_events;
create policy "insert own view only" on public.user_events for insert to authenticated
  with check (auth.uid() = user_id and event_type = 'course_view'
              and public.has_tracking_consent(auth.uid()));

-- Also guards service-role inserts, which bypass RLS, and any future writer.
create or replace function public.require_event_consent()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not coalesce((select p.tracking_consent from public.profiles p where p.id = new.user_id), false) then
    raise exception 'Tracking consent required' using errcode = 'PT001';
  end if;
  return new;
end $$;
revoke all on function public.require_event_consent() from public, anon, authenticated;
drop trigger if exists require_event_consent on public.user_events;
create trigger require_event_consent before insert on public.user_events
  for each row execute function public.require_event_consent();

-- Keep business writes working when consent is absent or withdrawn.
create or replace function public.record_ai_action()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if coalesce((select p.tracking_consent from public.profiles p where p.id = new.user_id), false) then
    begin
      insert into public.user_events (user_id, course_id, event_type)
      values (new.user_id, new.course_id, case tg_table_name
        when 'bookmarks' then 'bookmark'
        when 'cart_items' then 'add_to_cart'
        when 'enrollments' then 'enroll'
        when 'lesson_progress' then 'lesson_complete'
      end);
    exception when sqlstate 'PT001' then
      -- Consent may be withdrawn between the check and the insert.
      -- The business action must still succeed.
      null;
    end;
  end if;
  return new;
end $$;
revoke all on function public.record_ai_action() from public, anon, authenticated;

-- Keep the latest recommendation RPC's SQL and add the consent gate to recent.
-- The no-history path then uses its existing popularity/rating cold start.
create or replace function public.recommend_ai_courses(p_limit integer default 8)
returns table(course_id bigint, score double precision)
language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_limit is null or p_limit < 1 or p_limit > 20 then raise exception 'Invalid limit'; end if;
  return query
    with recent as (
      select e.course_id, e.event_type, e.created_at,
        row_number() over (partition by e.course_id, e.event_type order by e.created_at desc) as repeat_no
      from (select * from public.user_events ue
            where ue.user_id = v_uid and public.has_tracking_consent(v_uid)
              and ue.course_id is not null
              and ue.created_at > now() - interval '180 days'
            order by ue.created_at desc limit 100) e
    ), weighted as (
      select ce.embedding, greatest(1,
        (case r.event_type when 'course_view' then 1 when 'bookmark' then 3
          when 'add_to_cart' then 4 when 'enroll' then 5
          when 'lesson_complete' then 6 else 1 end)
        - floor(extract(epoch from (now() - r.created_at)) / 2592000)::int
      ) as weight
      from recent r join public.course_embeddings ce on ce.course_id = r.course_id
      where ce.model_name = 'gemini-embedding-2'
        and (r.event_type <> 'course_view' or r.repeat_no = 1)
    ), preference as (
      select avg(w.embedding) as embedding
      from weighted w cross join lateral generate_series(1, w.weight)
    )
    select c.id,
      (case when p.embedding is null then 0
        else 1 - (ce.embedding <=> p.embedding) end
       + case when c.is_popular then 0.03 else 0 end
       + least(c.rating::double precision / 100, 0.05))::double precision
    from public.courses c
    left join public.course_embeddings ce on ce.course_id = c.id
      and ce.model_name = 'gemini-embedding-2'
    cross join preference p
    where not exists (select 1 from public.enrollments en
                      where en.user_id = v_uid and en.course_id = c.id)
      and (p.embedding is null or ce.embedding is not null)
    order by 2 desc, c.created_at desc, c.id
    limit p_limit;
end $$;
revoke all on function public.recommend_ai_courses(integer) from public, anon;
grant execute on function public.recommend_ai_courses(integer) to authenticated;
commit;

-- Verify with two real JWTs (A unset, B granted), through the REST API/client:
-- 1. A: insert own course_view -> PT001; add bookmark/cart/progress -> succeeds,
--    with no new user_events row. A cannot UPDATE tracking_consent directly.
-- 2. B: set_tracking_consent(true); own course_view -> succeeds. B cannot read
--    or update A's profile; B cannot insert a row with user_id=A.
-- 3. B: set_tracking_consent(false); direct insert -> PT001; recommendation
--    returns cold start. Existing events remain until delete_my_tracking_data().
-- 4. B: delete_my_tracking_data(); verify only B's events were removed.
-- 5. With B granted, semantic-search still works and may write course_search.
--    With A unset, semantic-search still works and writes no event.
-- Rollback: restore the previous recommend_ai_courses and record_ai_action
-- definitions from the two prerequisite proposals, restore the prior INSERT
-- policy, drop require_event_consent trigger/function and the three new RPCs,
-- then restore previous profiles UPDATE grants. Leave columns and old event data
-- in place; dropping columns would discard consent decisions.
