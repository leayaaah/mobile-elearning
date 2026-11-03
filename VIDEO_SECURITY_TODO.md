# VIDEO SECURITY TODO — MUST NOT BE MISSED

> This note is intentionally kept at the project root. Do not remove it until the video implementation is secured.

## Temporary decision (31 October 2026)

- The app may keep using the sample Big Buck Bunny URL in `lessons.video_url` for development.
- The URL is currently publicly readable because `lessons` has a public read policy.
- This is acceptable only because the app has no official or licensed video source yet.
- Do not put official, paid, or copyrighted lesson videos into `lessons.video_url` under this temporary design.
- The video migration is **not applied** to the current Supabase project. The live schema still contains `lessons.video_url`; `lesson_videos` does not exist.

## Required before official video launch

- [ ] Confirm the video provider and licensing model.
- [ ] Remove public access to official video URLs.
- [ ] Apply `supabase/pending/20261029000000_remove_self_enroll.sql` only after checkout has been verified.
- [ ] Apply `supabase/pending/20261029000001_lesson_videos.sql` (or replace it with the final design).
- [ ] Update `schema.sql`, `seed.sql`, and the learning screen to read video URLs from the protected source.
- [ ] Use private storage or signed playback URLs where the provider supports it.
- [ ] Test anonymous access, authenticated-but-not-enrolled access, preview access, and enrolled access.

Until this checklist is completed, treat public `video_url` access as a known temporary limitation, not as a production-ready security design.
