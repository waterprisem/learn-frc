// Creates a stub page for every lesson in src/data/path.mjs that doesn't have one yet.
// Never overwrites an existing lesson. Run: npm run stubs
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessons } from '../src/data/path.mjs';

const docs = join(dirname(fileURLToPath(import.meta.url)), '../src/content/docs');
const q = (s) => JSON.stringify(s);
let created = 0;

for (const l of lessons) {
  const path = join(docs, l.track, `${l.slug}.mdx`);
  if (existsSync(path)) continue;
  mkdirSync(dirname(path), { recursive: true });
  const from = l.session
    ? `Based on Session ${l.session} of the Orbit Robotics curriculum.`
    : 'This lesson goes beyond the Orbit Robotics curriculum.';
  writeFileSync(
    path,
    `---
title: ${q(l.title)}
description: ${q(l.summary)}
id: ${q(l.id)}
track: ${q(l.track)}
session: ${l.session ?? 'null'}
isNew: ${l.isNew}
status: stub
sidebar:
  label: ${q(`${l.id} ${l.title}`)}
  order: ${l.order}
---

:::note[Coming soon]
This lesson is planned and not written yet.
:::

**What it will cover:** ${l.summary}

${from}
`,
  );
  created++;
}
console.log(`Stubs: ${created} created, ${lessons.length - created} already present.`);
