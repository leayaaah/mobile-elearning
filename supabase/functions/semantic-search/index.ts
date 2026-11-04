import { adminClient, CORS, embed, json, userClient, vectorLiteral } from '../_shared/ai.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const started = performance.now();
    const { client, user } = await userClient(req);
    const body = await req.json();
    const query = typeof body.query === 'string' ? body.query.trim().replace(/\s+/g, ' ') : '';
    const categoryId = body.categoryId == null ? null : Number(body.categoryId);
    if (query.length < 2 || query.length > 160 || (categoryId !== null && (!Number.isInteger(categoryId) || categoryId < 1))) {
      return json({ error: 'Invalid query' }, 400);
    }
    // Ten searches per minute per authenticated user. No query text or PII is stored.
    const since = new Date(Date.now() - 60000).toISOString();
    const { count, error: countError } = await client.from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('event_type', 'course_search').gte('created_at', since);
    if (countError) throw countError;
    if ((count ?? 0) >= 10) return json({ error: 'Rate limit exceeded' }, 429);

    const admin = adminClient();
    const { error: eventError } = await admin.from('user_events').insert({
      user_id: user.id, course_id: null, event_type: 'course_search', metadata: {},
    });
    if (eventError) throw eventError;
    const values = await embed(`task: search result | query: ${query}`);
    const { data, error } = await client.rpc('match_ai_courses', {
      p_embedding: vectorLiteral(values), p_limit: 60,
      p_exclude: [], p_category_id: categoryId,
    });
    if (error) throw error;
    return json({
      courseIds: (data ?? []).map((row: { course_id: number }) => row.course_id),
      durationMs: Math.round(performance.now() - started),
      geminiRequests: 1,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.message === 'Unauthorized') return json({ error: 'Unauthorized' }, 401);
    return json({ error: cause instanceof Error ? cause.message : 'Search failed' }, 503);
  }
});
