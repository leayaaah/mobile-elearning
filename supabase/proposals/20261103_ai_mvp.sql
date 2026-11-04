-- PROPOSAL ONLY. Review against the live schema and back up the database before applying.
-- Requires pgvector in the extensions schema. Existing enrollment/checkout/lesson policies are untouched.
create schema if not exists extensions;
create extension if not exists vector with schema extensions;
grant usage on schema extensions to authenticated;

create table public.user_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id bigint references public.courses(id) on delete cascade,
  event_type text not null check (event_type in (
    'course_view', 'course_search', 'bookmark', 'add_to_cart', 'enroll', 'lesson_complete'
  )),
  metadata jsonb not null default '{}'::jsonb check (metadata = '{}'::jsonb),
  created_at timestamptz not null default now(),
  constraint event_course check (
    (event_type = 'course_search' and course_id is null) or
    (event_type <> 'course_search' and course_id is not null)
  )
);
create index user_events_user_time_idx on public.user_events (user_id, created_at desc);
create index user_events_course_type_idx on public.user_events (course_id, event_type);
alter table public.user_events enable row level security;
revoke all on public.user_events from anon, authenticated;
grant select, insert on public.user_events to authenticated;
grant usage on sequence public.user_events_id_seq to authenticated;
create policy "read own events" on public.user_events for select to authenticated
  using (auth.uid() = user_id);
create policy "insert own view only" on public.user_events for insert to authenticated
  with check (auth.uid() = user_id and event_type = 'course_view');

-- These four events reflect persisted actions, never an arbitrary client event.
create or replace function public.record_ai_action()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_events (user_id, course_id, event_type)
  values (new.user_id, new.course_id, case tg_table_name
    when 'bookmarks' then 'bookmark'
    when 'cart_items' then 'add_to_cart'
    when 'enrollments' then 'enroll'
    when 'lesson_progress' then 'lesson_complete'
  end);
  return new;
end $$;
revoke all on function public.record_ai_action() from public, anon, authenticated;
create trigger ai_bookmark_event after insert on public.bookmarks
  for each row execute function public.record_ai_action();
create trigger ai_cart_event after insert on public.cart_items
  for each row execute function public.record_ai_action();
create trigger ai_enroll_event after insert on public.enrollments
  for each row execute function public.record_ai_action();
create trigger ai_lesson_event after insert on public.lesson_progress
  for each row execute function public.record_ai_action();

create table public.course_embeddings (
  course_id bigint primary key references public.courses(id) on delete cascade,
  embedding extensions.vector(768) not null,
  model_name text not null check (model_name = 'gemini-embedding-2'),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null default now()
);
alter table public.course_embeddings enable row level security;
revoke all on public.course_embeddings from anon, authenticated;
-- Exact cosine scan is appropriate for the small seed. Add HNSW after measuring at scale.

create or replace function public.match_ai_courses(
  p_embedding extensions.vector(768), p_limit integer default 10,
  p_exclude bigint[] default '{}', p_category_id bigint default null
)
returns table(course_id bigint, similarity double precision)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_embedding is null or p_limit is null or p_limit < 1 or p_limit > 60
     or cardinality(p_exclude) > 100 then raise exception 'Invalid search input'; end if;
  return query
    select ce.course_id, (1 - (ce.embedding <=> p_embedding))::double precision
    from public.course_embeddings ce
    join public.courses c on c.id = ce.course_id
    where ce.model_name = 'gemini-embedding-2'
      and not (ce.course_id = any(coalesce(p_exclude, '{}'::bigint[])))
      and (p_category_id is null or c.category_id = p_category_id)
    order by ce.embedding <=> p_embedding, ce.course_id
    limit p_limit;
end $$;
revoke all on function public.match_ai_courses(extensions.vector, integer, bigint[], bigint) from public, anon;
grant execute on function public.match_ai_courses(extensions.vector, integer, bigint[], bigint) to authenticated;

create or replace function public.similar_ai_courses(p_course_id bigint, p_limit integer default 3)
returns table(course_id bigint, similarity double precision)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_course_id is null or p_course_id < 1 or p_limit is null or p_limit < 1 or p_limit > 12
    then raise exception 'Invalid input'; end if;
  return query
    select candidate.course_id,
      (1 - (candidate.embedding <=> source.embedding))::double precision
    from public.course_embeddings source
    join public.course_embeddings candidate on candidate.course_id <> source.course_id
    where source.course_id = p_course_id
      and source.model_name = 'gemini-embedding-2'
      and candidate.model_name = source.model_name
    order by candidate.embedding <=> source.embedding, candidate.course_id
    limit p_limit;
end $$;
revoke all on function public.similar_ai_courses(bigint, integer) from public, anon;
grant execute on function public.similar_ai_courses(bigint, integer) to authenticated;

create or replace function public.recommend_ai_courses(p_limit integer default 8)
returns table(course_id bigint, score double precision)
language plpgsql stable security definer set search_path = public, extensions as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_limit is null or p_limit < 1 or p_limit > 20 then raise exception 'Invalid limit'; end if;
  return query
    with recent as (
      select e.course_id, e.event_type, e.created_at,
        row_number() over (partition by e.course_id, e.event_type order by e.created_at desc) as repeat_no
      from (select * from public.user_events ue
            where ue.user_id = v_uid and ue.course_id is not null
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

-- Retention proposal: schedule monthly only after approval, e.g. delete events older than 180 days.
-- Review with two authenticated users: own-event reads, cross-user reads, forged inserts,
-- anonymous RPC, and exclusion of enrolled courses before enabling the app features.
