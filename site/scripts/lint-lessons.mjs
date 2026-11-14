// Quick structural lint for lesson pages (read-only). Run: node scripts/lint-lessons.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'src/content/docs';
const playgrounds = /<(FlywheelTuner|RobotTour|ControlSystemMap|BrownoutDemo|CanBusSim)\b[^>]*lessonId/;
let stubs = 0, lessons = 0, problems = 0;
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
for (const file of walk(root).filter((f) => f.endsWith('.mdx')).sort()) {
  const text = readFileSync(file, 'utf8');
  const [, front = '', body = ''] = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
  if (!/^id:/m.test(front)) continue;
  if (/^status: stub/m.test(front)) { stubs++; continue; }
  lessons++;
  const notes = [];
  const imports = [...body.matchAll(/^import (\w+) from/gm)].map((m) => m[1]);
  const rest = body.replace(/^import .*$/gm, '');
  for (const name of imports) if (!new RegExp(`<${name}\\b`).test(rest)) notes.push(`unused import ${name}`);
  for (const [, name] of rest.matchAll(/<([A-Z]\w+)\b/g)) if (!imports.includes(name)) notes.push(`missing import ${name}`);
  const prose = rest.replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, ' ').replace(/\{[\s\S]*?\}/g, ' ');
  const words = prose.split(/\s+/).filter(Boolean).length;
  if (words > 1300) notes.push(`${words} words`);
  for (const h of ['## Practice', '## Checkpoint', '## Recap']) if (!rest.includes(`\n${h}\n`)) notes.push(`no "${h}"`);
  if (/^## Try it/m.test(rest) && !playgrounds.test(rest)) notes.push('"Try it" heading without a playground that can tick it');
  for (const key of ['minutes:', 'outcomes:', 'sources:']) if (!front.includes(key)) notes.push(`frontmatter lacks ${key}`);
  if (/sources: \[\]/.test(front)) notes.push('no sources');
  if (notes.length) { problems++; console.log(`${file.replace(root + '/', '')}: ${[...new Set(notes)].join('; ')}`); }
}
console.log(`${lessons} lessons written, ${stubs} stubs left, ${problems} with notes.`);
