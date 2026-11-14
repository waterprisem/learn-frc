import { CircleHelp } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** A small ? button that opens a short hint. Use it instead of putting helper text on the page. */
export default function Tip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [open]);

  return (
    <span className="lf-tip" ref={root}>
      <button type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)}>
        <CircleHelp size={16} aria-hidden="true" />
      </button>
      {open && <span role="note">{children}</span>}
    </span>
  );
}
