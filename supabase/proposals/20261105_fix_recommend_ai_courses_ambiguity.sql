-- Apply once on a database where 20261103_ai_mvp.sql was already applied.
-- Replaces only the recommendation RPC; no table data or permissions change.
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
