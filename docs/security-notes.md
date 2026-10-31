# Video security status

## Current temporary state

The app currently reads the nullable `lessons.video_url` column. The table has a public read policy, so any client with the Supabase anon key can read that URL. This is intentionally accepted for development because the project does not yet have an official video source.

The live Supabase schema was checked on 31 October 2026:

- `lessons.video_url` exists and contains the sample Big Buck Bunny URL.
- `lesson_videos` does not exist (the REST endpoint returned 404).
- The video migration has not been executed.

Do not add official, paid, or copyrighted lesson URLs while this temporary design remains active.

The prominent project-level reminder is [VIDEO_SECURITY_TODO.md](../VIDEO_SECURITY_TODO.md). It must remain until protected video delivery is implemented and tested.

## Deferred migration

The SQL files are intentionally stored under `supabase/pending/`, not `supabase/migrations/`, so they are not picked up as migrations accidentally:

1. Remove the temporary self-enrollment policy after checkout has been verified.
2. Move to a protected `lesson_videos` design and update the client in the same change.

The app must stop selecting `lessons.video_url` before the second migration is applied.

## Final video implementation requirements

- Use a private storage bucket or a provider with signed playback URLs.
- Authorize enrolled users and explicitly allowed preview lessons.
- Test anonymous, authenticated-not-enrolled, preview, and enrolled access.
- Update `schema.sql`, `seed.sql`, services, and the learning screen together.
