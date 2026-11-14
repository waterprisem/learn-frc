import { useRef, useState } from 'react';
import { runComposition, type Child, type CompositionKind } from '../../sim/commands/composition';
import Tasks from './Tasks';

const KINDS: Array<{ kind: CompositionKind; label: string; code: string }> = [
  { kind: 'sequence', label: 'Sequence', code: 'Commands.sequence' },
  { kind: 'parallel', label: 'Parallel', code: 'Commands.parallel' },
  { kind: 'race', label: 'Race', code: 'Commands.race' },
  { kind: 'deadline', label: 'Deadline', code: 'Commands.deadline' },
];
const MAX_SECONDS = 8;

/** Pick how three commands are combined and see when each one starts and stops. */
export default function CompositionBuilder({ lessonId }: { lessonId?: string }) {
  const [kind, setKind] = useState<CompositionKind>('sequence');
  const [durations, setDurations] = useState([1.2, 0.8, 2]);
  const [deadline, setDeadline] = useState(0);
  const tried = useRef(new Set<CompositionKind>());
  tried.current.add(kind);

  const children: Child[] = [
    { name: 'Elevator to height', duration: durations[0] },
    { name: 'Arm to angle', duration: durations[1] },
    { name: 'Flywheel to speed', duration: durations[2] },
  ];
  const run = runComposition(kind, children, deadline);
  const scale = (t: number) => `${(t / MAX_SECONDS) * 100}%`;
  const spec = KINDS.find((k) => k.kind === kind)!;

  return (
    <div className="lf-playground lf-compose not-content">
      <Tasks
        lessonId={lessonId}
        tasks={KINDS.map((k) => ({ label: `Try ${k.label.toLowerCase()}`, done: tried.current.has(k.kind) }))}
      />
      <div className="lf-seg four" role="group" aria-label="Composition">
        {KINDS.map((k) => (
          <button key={k.kind} type="button" aria-pressed={kind === k.kind} onClick={() => setKind(k.kind)}>{k.label}</button>
        ))}
      </div>

      <div className="lf-compose-knobs">
        {children.map((c, i) => (
          <label key={c.name} className="lf-knob">
            <span className="name"><b>{c.name}</b> takes {c.duration.toFixed(1)} s{kind === 'deadline' && deadline === i ? ' (the deadline)' : ''}</span>
            <input
              type="range" min={0.2} max={4} step={0.1} value={c.duration} aria-label={`${c.name} duration`}
              onChange={(e) => setDurations(durations.map((d, j) => (j === i ? +e.target.value : d)))}
            />
            {kind === 'deadline' ? (
              <button type="button" aria-pressed={deadline === i} onClick={() => setDeadline(i)}>Deadline</button>
            ) : <span />}
          </label>
        ))}
      </div>

      <div className="lf-gantt" role="table" aria-label="When each command runs">
        {run.bars.map((b) => (
          <div className="row" role="row" key={b.name}>
            <span className="name" role="rowheader">{b.name}</span>
            <span className="track">
              <i className={b.cancelled ? 'cancelled' : 'finished'} style={{ left: scale(b.start), width: scale(b.end - b.start) }}>
                {b.cancelled ? 'end(true)' : 'end(false)'}
              </i>
            </span>
          </div>
        ))}
        <div className="row group">
          <span className="name">The group</span>
          <span className="track"><i className="whole" style={{ left: 0, width: scale(run.end) }}>{run.end.toFixed(1)} s</i></span>
        </div>
      </div>
      <p className="lf-calls"><code>{spec.code}(…)</code> ends at <b>{run.end.toFixed(1)} s</b></p>
    </div>
  );
}
