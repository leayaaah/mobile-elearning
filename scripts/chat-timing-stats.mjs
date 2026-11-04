import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) {
  console.error('Usage: node scripts/chat-timing-stats.mjs timings.jsonl');
  process.exit(1);
}

const rows = readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean)
  .map((line) => JSON.parse(line))
  .filter((row) => row.event === 'chat_timing' && row.status === 200);
if (!rows.length) {
  console.error('No successful chat_timing rows found.');
  process.exit(1);
}

function percentile(values, percent) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * percent / 100) - 1)];
}

for (const key of ['auth', 'usage', 'enrolled', 'embed', 'match', 'candidates', 'prompt', 'llm', 'total', 'inputTokens', 'outputTokens']) {
  const values = rows.map((row) => row[key]).filter((value) => typeof value === 'number');
  if (values.length) console.log(`${key.padEnd(13)} n=${String(values.length).padEnd(3)} p50=${percentile(values, 50)} p95=${percentile(values, 95)}`);
}
console.log(`samples=${rows.length} fallback=${rows.filter((row) => row.source === 'fallback').length}`);
