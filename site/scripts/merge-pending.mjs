// Merges the per-lesson files that lesson-writing agents leave in planning/pending/ into the shared files:
//   <id>.glossary.yaml  → src/content/glossary.yaml (new keys only)
//   <id>.manifest.json  → src/snippets/manifest.json (new ids only)
// Merged files are moved to planning/pending/done/. Run: node scripts/merge-pending.mjs
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const here = dirname(fileURLToPath(import.meta.url));
const pending = join(here, '../../planning/pending');
const done = join(pending, 'done');
if (!existsSync(pending)) process.exit(0);
mkdirSync(done, { recursive: true });

const glossaryPath = join(here, '../src/content/glossary.yaml');
const manifestPath = join(here, '../src/snippets/manifest.json');
const glossary = parse(readFileSync(glossaryPath, 'utf8')) ?? {};
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const ids = new Set(manifest.map((m) => m.id));
let added = '';
let terms = 0;
let snippets = 0;

for (const name of readdirSync(pending).sort()) {
  const path = join(pending, name);
  try {
    if (name.endsWith('.glossary.yaml')) {
      for (const [key, entry] of Object.entries(parse(readFileSync(path, 'utf8')) ?? {})) {
        if (key in glossary || !entry?.term || !entry?.short) continue;
        const clean = { term: String(entry.term), short: String(entry.short).slice(0, 160), lessons: (entry.lessons ?? []).map(String) };
        glossary[key] = clean;
        added += stringify({ [key]: clean }, { lineWidth: 0 });
        terms++;
      }
    } else if (name.endsWith('.manifest.json')) {
      for (const m of JSON.parse(readFileSync(path, 'utf8'))) {
        if (!m?.id || ids.has(m.id)) continue;
        manifest.push({ id: m.id, from: m.from, start: m.start, end: m.end });
        ids.add(m.id);
        snippets++;
      }
    } else continue;
    renameSync(path, join(done, name));
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
  }
}

if (added) writeFileSync(glossaryPath, readFileSync(glossaryPath, 'utf8').trimEnd() + '\n' + added);
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Merged ${terms} glossary term(s) and ${snippets} snippet(s).`);
