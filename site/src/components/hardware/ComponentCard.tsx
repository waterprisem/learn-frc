import { ArrowRight } from 'lucide-react';
import { devices, LAYERS, type Device, type DeviceId, type Layer } from '../../data/hardware';

/** A layer name with a sample of the line that layer uses on the control-system map. */
export function LayerChip({ layer }: { layer: Layer }) {
  const l = LAYERS[layer];
  return (
    <span className="lf-chip">
      <svg width="22" height="8" aria-hidden="true">
        <line x1="1" x2="21" y1="4" y2="4" stroke={`var(${l.cssVar})`} strokeWidth={l.width} strokeDasharray={l.dash} />
      </svg>
      {l.label}
    </span>
  );
}

/** One device: what it is, where it sits, how it connects, how code sees it, and how it fails. */
export default function ComponentCard({ id, link = true }: { id: DeviceId; link?: boolean }) {
  const d: Device = devices[id];
  return (
    <article className="lf-card not-content">
      <header>
        <h4>{d.name}</h4>
        <span className="chips">{d.connects.map((l) => <LayerChip key={l} layer={l} />)}</span>
      </header>
      <p>{d.what}</p>
      <dl>
        <dt>Where</dt>
        <dd>{d.where}</dd>
        <dt>In code</dt>
        <dd>{d.code ? <code>{d.code}</code> : d.codeNote}</dd>
        <dt>When it fails</dt>
        <dd>
          <ul>
            {d.failures.map((f) => <li key={f.symptom}><b>{f.symptom}:</b> {f.cause}.</li>)}
          </ul>
        </dd>
      </dl>
      {link && d.lesson && <a href={d.lesson.href}>{d.lesson.label}<ArrowRight size={14} aria-hidden="true" /></a>}
    </article>
  );
}
