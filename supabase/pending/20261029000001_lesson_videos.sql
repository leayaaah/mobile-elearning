-- PENDING: do not run while the app still reads lessons.video_url.
-- Move this file into supabase/migrations/ only after the client and schema
-- are updated together for protected video access.

create table public.lesson_videos (
  lesson_id bigint primary key references public.lessons(id) on delete cascade,
  course_id bigint not null references public.courses(id) on delete cascade,
  video_url text not null
);

insert into public.lesson_videos (lesson_id, course_id, video_url)
select id, course_id, video_url
from public.lessons
where video_url is not null;

alter table public.lessons drop column video_url;

alter table public.lesson_videos enable row level security;

create policy "enrolled or preview read video" on public.lesson_videos
  for select using (
    public.is_enrolled(course_id)
    or exists (
      select 1 from public.lessons l
      where l.id = lesson_videos.lesson_id and l.is_preview
    )
  );
