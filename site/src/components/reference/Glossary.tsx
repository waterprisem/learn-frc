import { useMemo, useState } from 'react';

export interface Entry {
  id: string;
  term: string;
  short: string;
  long?: string;
  lessons: Array<{ id: string; title: string; href: string }>;
}

/** Every term with a search box. */
export default function Glossary({ entries }: { entries: Entry[] }) {
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return entries.filter((e) => !s || e.term.toLowerCase().includes(s) || e.short.toLowerCase().includes(s));
  }, [entries, q]);

  return (
    <div className="lf-glossary not-content">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms" aria-label="Search terms" />
      <dl>
        {shown.map((e) => (
          <div key={e.id} id={e.id}>
            <dt>{e.term}</dt>
            <dd>
              {e.short}
              {e.long && <p>{e.long}</p>}
              {e.lessons.length > 0 && (
                <span className="lessons">{e.lessons.map((l) => <a key={l.id} href={l.href}>{l.id} {l.title}</a>)}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {shown.length === 0 && <p className="empty">No term matches.</p>}
    </div>
  );
}
