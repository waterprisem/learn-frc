import { CircleCheck, RotateCcw, TriangleAlert } from 'lucide-react';
import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { devices, type DeviceId } from '../../data/hardware';
import { updateLesson } from '../../stores/progress';
import ComponentCard from '../hardware/ComponentCard';

/** Parts on the top-view drawing: the shape, and where its label goes. */
const PARTS: Array<{ id: DeviceId; short: string; shape: ReactNode; label: [number, number] }> = [
  { id: 'camera', short: 'Camera', shape: <path d="M250 22h60l8 26h-76z" />, label: [280, 40] },
  { id: 'roborio', short: 'roboRIO', shape: <rect x="170" y="78" width="110" height="60" rx="5" />, label: [225, 113] },
  { id: 'radio', short: 'Radio', shape: <rect x="300" y="78" width="80" height="40" rx="5" />, label: [340, 103] },
  { id: 'pdh', short: 'PDH', shape: <rect x="170" y="158" width="150" height="56" rx="5" />, label: [245, 191] },
  { id: 'pigeon', short: 'Pigeon 2', shape: <rect x="328" y="162" width="60" height="48" rx="5" />, label: [358, 191] },
  { id: 'battery', short: 'Battery', shape: <rect x="170" y="240" width="130" height="72" rx="5" />, label: [235, 281] },
  { id: 'breaker', short: 'Breaker', shape: <circle cx="350" cy="276" r="30" />, label: [350, 281] },
  { id: 'kraken', short: 'Kraken', shape: <circle cx="103" cy="85" r="27" />, label: [103, 90] },
  { id: 'cancoder', short: 'CANcoder', shape: <rect x="420" y="66" width="74" height="38" rx="5" />, label: [457, 90] },
  { id: 'limit-switch', short: 'Limit', shape: <rect x="392" y="212" width="46" height="26" rx="5" />, label: [415, 230] },
];

const press = (run: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); }
};

/** A top view of a robot. Explore it part by part, or let it quiz you on where each part is. */
export default function RobotTour({ lessonId }: { lessonId?: string }) {
  const [mode, setMode] = useState<'explore' | 'find'>('explore');
  const [selected, setSelected] = useState<DeviceId | null>(null);
  const [found, setFound] = useState<DeviceId[]>([]);
  const [miss, setMiss] = useState<DeviceId | null>(null);

  const target = PARTS.map((p) => p.id).find((id) => !found.includes(id)) ?? null;
  const allFound = target === null;

  useEffect(() => {
    if (lessonId && allFound) updateLesson(lessonId, { guideDone: true });
  }, [lessonId, allFound]);

  function click(id: DeviceId) {
    if (mode === 'explore') return setSelected(id);
    if (allFound || found.includes(id)) return;
    if (id === target) { setFound([...found, id]); setMiss(null); setSelected(id); }
    else setMiss(id);
  }
  function switchMode(next: 'explore' | 'find') {
    setMode(next);
    setSelected(null);
    setMiss(null);
  }

  const finding = mode === 'find';

  return (
    <div className="lf-playground lf-tour">
      <div className="lf-pg-bar head">
        <div className="lf-seg two" role="group" aria-label="Mode">
          <button type="button" aria-pressed={!finding} onClick={() => switchMode('explore')}>Explore</button>
          <button type="button" aria-pressed={finding} onClick={() => switchMode('find')}>Find it</button>
        </div>
        {finding && (
          <>
            <span className="spacer" />
            <span>{found.length} of {PARTS.length} found</span>
            <button type="button" onClick={() => { setFound([]); setMiss(null); setSelected(null); }}><RotateCcw size={15} aria-hidden="true" />Restart</button>
          </>
        )}
      </div>

      {finding && (
        <p className="quest" role="status">
          {allFound ? (
            <><CircleCheck size={17} aria-hidden="true" className="ok" /> You found every part.</>
          ) : miss ? (
            <><TriangleAlert size={17} aria-hidden="true" className="warn" /> That one is: {PARTS.find((p) => p.id === miss)!.short}. Find: <b>{devices[target].clue}</b></>
          ) : (
            <>Find: <b>{devices[target].clue}</b></>
          )}
        </p>
      )}

      <div className="split">
        <svg viewBox="0 0 560 380" role="group" aria-label="Top view of a robot. The front is at the top.">
          <rect className="bumper" x="40" y="48" width="480" height="300" rx="20" />
          <rect className="frame" x="56" y="64" width="448" height="268" rx="10" />
          {/* Swerve modules in the corners, and the elevator on the right */}
          {[[66, 74], [420, 74], [66, 248], [420, 248]].map(([x, y]) => (
            <g key={`${x}-${y}`} className="deco">
              <rect x={x} y={y} width="74" height="74" rx="8" />
              <rect x={x + 50} y={y + 14} width="12" height="46" rx="4" />
            </g>
          ))}
          <g className="deco">
            <rect x="440" y="164" width="28" height="74" rx="3" />
            <text className="muted" x="454" y="160" textAnchor="middle">Elevator</text>
          </g>
          <text className="muted" x="280" y="14" textAnchor="middle">Front</text>

          {PARTS.map((p) => {
            const isFound = found.includes(p.id);
            const showLabel = !finding || isFound;
            return (
              <g
                key={p.id}
                role="button"
                tabIndex={0}
                aria-pressed={selected === p.id}
                aria-label={showLabel ? devices[p.id].name : 'Unlabeled part'}
                className={`part${selected === p.id ? ' sel' : ''}${isFound && finding ? ' found' : ''}${miss === p.id ? ' miss' : ''}`}
                onClick={() => click(p.id)}
                onKeyDown={press(() => click(p.id))}
              >
                {p.shape}
                {showLabel && <text x={p.label[0]} y={p.label[1]} textAnchor="middle">{p.short}</text>}
              </g>
            );
          })}
        </svg>

        <div className="side" aria-live="polite">
          {selected ? <ComponentCard id={selected} /> : !finding && <p className="empty">Select a part.</p>}
        </div>
      </div>
    </div>
  );
}
