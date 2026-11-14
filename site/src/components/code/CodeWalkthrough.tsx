import { ChevronLeft, ChevronRight, MousePointerClick } from 'lucide-react';
import { useState } from 'react';

export interface CodeToken { text: string; style: Record<string, string> }
export interface CodeNote { start: number; end: number; html: string }

interface Props {
  title?: string;
  lines: CodeToken[][];
  notes: CodeNote[];
}

/**
 * Code you step through: click a highlighted line (or use Next) and its explanation opens right under it.
 */
export default function CodeWalkthrough({ title, lines, notes }: Props) {
  const [active, setActive] = useState(0);
  const noteAt = (line: number) => notes.findIndex((n) => line >= n.start && line <= n.end);

  return (
    <div className="lf-walk not-content">
      <header>
        <span className="file">{title}</span>
        {notes.length > 0 && (
          <span className="hint" title="Click a highlighted line to explain it"><MousePointerClick size={15} aria-label="Click a highlighted line to explain it" /></span>
        )}
      </header>
      <div className="code" role="group" aria-label={title ? `Code from ${title}` : 'Code'}>
        {lines.map((tokens, i) => {
          const line = i + 1;
          const ni = noteAt(line);
          const note = notes[ni];
          const open = ni === active;
          const content = (
            <>
              <span className="gutter">{note && line === note.start ? <span className="badge">{ni + 1}</span> : null}</span>
              <code>
                {tokens.length ? tokens.map((t, k) => <span key={k} style={t.style}>{t.text}</span>) : ' '}
              </code>
            </>
          );
          return (
            <div key={i}>
              {note ? (
                <button
                  type="button"
                  className={`line hot${open ? ' open' : ''}`}
                  aria-expanded={open}
                  aria-label={line === note.start ? undefined : `Explanation ${ni + 1}`}
                  tabIndex={line === note.start ? 0 : -1}
                  onClick={() => setActive(open ? -1 : ni)}
                >
                  {content}
                </button>
              ) : (
                <div className="line">{content}</div>
              )}
              {note && open && line === note.end && (
                <div className="note" role="status">
                  <p dangerouslySetInnerHTML={{ __html: note.html }} />
                  <div className="nav">
                    <span>{ni + 1} of {notes.length}</span>
                    <button type="button" disabled={ni === 0} onClick={() => setActive(ni - 1)}>
                      <ChevronLeft size={14} aria-hidden="true" />Back
                    </button>
                    <button type="button" className="primary" disabled={ni === notes.length - 1} onClick={() => setActive(ni + 1)}>
                      Next<ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
