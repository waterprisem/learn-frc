import { getCollection } from 'astro:content';

/** The glossary as JSON, fetched by the tooltip script (src/theme/glossaryScript.mjs). */
export async function GET() {
  const entries = await getCollection('glossary');
  const body = entries.map((e) => ({ id: e.id, term: e.data.term, short: e.data.short, lessons: e.data.lessons }));
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}
