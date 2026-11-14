// Copies line ranges of real lab code from the (local-only) curriculum folder into src/snippets/.
// Snippets are committed, so the site builds without the curriculum present.
// Manifest: src/snippets/manifest.json → [{ "id", "from" (path inside OrbitRoboticsCurriculum), "start", "end" }]
// Run: npm run snippets
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const curriculum = join(here, '../../OrbitRoboticsCurriculum');
const out = join(here, '../src/snippets');
const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'));

if (!existsSync(curriculum)) {
  console.log('Curriculum folder not found; keeping the committed snippets as they are.');
  process.exit(0);
}

/** Remove the indentation shared by every non-empty line. */
function dedent(lines) {
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length);
  const n = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(n));
}

let failed = 0;
for (const { id, from, start, end } of manifest) {
  const src = join(curriculum, from);
  if (!existsSync(src)) {
    console.error(`✗ ${id}: missing ${from}`);
    failed++;
    continue;
  }
  const all = readFileSync(src, 'utf8').split('\n');
  if (start < 1 || end > all.length || start > end) {
    console.error(`✗ ${id}: lines ${start}-${end} are outside ${from} (${all.length} lines)`);
    failed++;
    continue;
  }
  const file = join(out, `${id}${extname(from) || '.txt'}`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, dedent(all.slice(start - 1, end)).join('\n') + '\n');
  console.log(`✓ ${id} ← ${from}:${start}-${end}`);
}
process.exit(failed ? 1 : 0);
