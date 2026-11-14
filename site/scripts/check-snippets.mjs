// Verifies that every committed snippet still matches its line range in the curriculum (read-only; changes nothing).
// Run: node scripts/check-snippets.mjs
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const curriculum = join(here, '../../OrbitRoboticsCurriculum');
const out = join(here, '../src/snippets');
const norm = (s) => s.split('\n').map((l) => l.trim()).join('\n').trim();
let bad = 0;
for (const { id, from, start, end } of JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'))) {
  const src = join(curriculum, from);
  const file = join(out, `${id}.java`);
  if (!existsSync(src)) { console.log(`✗ ${id}: source missing: ${from}`); bad++; continue; }
  if (!existsSync(file)) { console.log(`✗ ${id}: snippet file missing`); bad++; continue; }
  const want = norm(readFileSync(src, 'utf8').split('\n').slice(start - 1, end).join('\n'));
  if (want !== norm(readFileSync(file, 'utf8'))) { console.log(`✗ ${id}: differs from ${from}:${start}-${end}`); bad++; }
}
console.log(bad ? `${bad} snippet(s) need attention.` : 'All snippets match their sources.');
