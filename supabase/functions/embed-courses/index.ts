import { adminClient, CORS, embed, isAdminRequest, json, MODEL, vectorLiteral } from '../_shared/ai.ts';

type CourseRow = {
  id: number;
  title: string;
  description: string | null;
  category: { name: string } | { name: string }[] | null;
};

function documentText(course: CourseRow): string {
  const category = Array.isArray(course.category) ? course.category[0] : course.category;
  return `title: ${course.title.trim()} | text: ${[course.description?.trim(), category?.name]
    .filter(Boolean).join(' | Danh mục: ').slice(0, 6000)}`;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  // Only a server-side admin job may call this function. Never ship the service key in Expo.
  if (!isAdminRequest(req)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  try {
    const body = await req.json().catch(() => ({}));
    const afterId = Number(body.afterId ?? 0);
    const limit = Number(body.limit ?? 10);
    if (!Number.isSafeInteger(afterId) || afterId < 0 || !Number.isInteger(limit) || limit < 1 || limit > 10) {
      return json({ error: 'Invalid cursor or limit' }, 400);
    }
    const admin = adminClient();
    const { data, error } = await admin.from('courses')
      .select('id,title,description,category:categories(name)')
      .gt('id', afterId).order('id').limit(limit);
    if (error) throw error;
    const courses = (data ?? []) as CourseRow[];
    const ids = courses.map((course) => course.id);
    const { data: existing, error: existingError } = ids.length
      ? await admin.from('course_embeddings').select('course_id,content_hash,model_name').in('course_id', ids)
      : { data: [], error: null };
    if (existingError) throw existingError;
    const hashes = new Map((existing ?? []).map((row) => [row.course_id, row]));
    let embedded = 0;
    let skipped = 0;
    const failures: { courseId: number; reason: string }[] = [];
    for (const course of courses) {
      try {
        const text = documentText(course);
        const hash = await sha256(`${MODEL}:${text}`);
        const old = hashes.get(course.id);
        if (old?.content_hash === hash && old.model_name === MODEL) {
          skipped += 1;
          continue;
        }
        const values = await embed(text);
        const { error: saveError } = await admin.from('course_embeddings').upsert({
          course_id: course.id,
          embedding: vectorLiteral(values),
          model_name: MODEL,
          content_hash: hash,
          updated_at: new Date().toISOString(),
        });
        if (saveError) throw saveError;
        embedded += 1;
      } catch (cause) {
        failures.push({ courseId: course.id, reason: cause instanceof Error ? cause.message : 'Unknown error' });
      }
    }
    return json({ embedded, skipped, failures, nextAfterId: courses.at(-1)?.id ?? null });
  } catch (cause) {
    return json({ error: cause instanceof Error ? cause.message : 'Embedding failed' }, 500);
  }
});
