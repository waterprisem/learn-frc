import { Pause, Play, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  commandRuns, constantTimeline, fireMarkers, PathGeometry, REGISTERED, trapezoidTimeline,
  type Marker, type Pt,
} from '../../sim/auto/pathTimeline';
import Tip from '../viz/Tip';
import Tasks from './Tasks';

const PX = 50;
const SIZE = 6;
const MAX_V = 3;
const MAX_A = 3;
const MAX_WAYPOINTS = 8;
const MAX_MARKERS = 4;
const sx = (m: number) => m * PX;
const sy = (m: number) => (SIZE - m) * PX;
const DEFAULT_WAYPOINTS: Pt[] = [{ x: 0.8, y: 1 }, { x: 2.2, y: 3.8 }, { x: 4, y: 2.8 }, { x: 5.2, y: 5 }];
type Profile = 'constant' | 'trapezoid';

/** Draw a path, place named event markers on it, and play the auto to see when each marker fires. */
export default function PathMarkers({ lessonId }: { lessonId?: string }) {
  const [waypoints, setWaypoints] = useState<Pt[]>(DEFAULT_WAYPOINTS);
  const [markers, setMarkers] = useState<Marker[]>([{ id: 1, name: 'PREPARE_TO_SHOOT', at: 0.4 }]);
  const [profile, setProfile] = useState<Profile>('trapezoid');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const nextId = useRef(2);
  const seen = useRef({ edited: false, stopped: false, misspelled: false });

  const path = useMemo(() => new PathGeometry(waypoints), [waypoints]);
  const timeline = useMemo(
    () => (profile === 'constant' ? constantTimeline(path.length, MAX_V) : trapezoidTimeline(path.length, MAX_V, MAX_A)),
    [path, profile],
  );
  const firings = useMemo(() => fireMarkers(markers, timeline, path.length), [markers, timeline, path]);
  const runs = useMemo(() => commandRuns(firings, timeline.duration), [firings, timeline]);
  const duration = path.length > 0 ? timeline.duration : 0;

  const live = useRef({ playing, duration });
  live.current = { playing, duration };
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.1);
      prev = now;
      if (live.current.playing) {
        setT((v) => {
          const next = Math.min(v + dt, live.current.duration);
          if (next >= live.current.duration) setPlaying(false);
          return next;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const done = duration > 0 && t >= duration - 1e-6;
  if (done && runs.some((r) => r.endedBy === 'marker')) seen.current.stopped = true;
  if (firings.some((f) => !f.bound && t >= f.time && t > 0)) seen.current.misspelled = true;

  function edit(next: Pt[]) {
    setWaypoints(next);
    setT(0);
    setPlaying(false);
    seen.current.edited = true;
  }

  function onField(e: React.MouseEvent<SVGSVGElement>) {
    if (waypoints.length >= MAX_WAYPOINTS) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * SIZE;
    const y = SIZE - ((e.clientY - box.top) / box.height) * SIZE;
    edit([...waypoints, { x: Math.round(x * 20) / 20, y: Math.round(y * 20) / 20 }]);
  }

  const setMarker = (id: number, patch: Partial<Marker>) => setMarkers(markers.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const here = path.pointAt(timeline.distanceAt(t));
  const running = runs.filter((r) => t >= r.start && t < r.end);
  const fired = (id: number) => firings.find((f) => f.marker.id === id)!;

  // Timeline drawing
  const W = 320;
  const tx = (time: number) => (duration > 0 ? (time / duration) * W : 0);

  return (
    <div className="lf-playground lf-pathm not-content">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Click the field to add a waypoint', done: seen.current.edited },
          { label: 'Add a STOP_TURRETED_SHOOTING marker and play until the shot command ends on it', done: seen.current.stopped },
          { label: 'Change one letter of a marker name and play past it', done: seen.current.misspelled },
        ]}
      />
      <div className="lf-pg-top lf-pathm-top">
        <div className="lf-pg-controls">
          <fieldset>
            <legend>Timeline</legend>
            <div className="lf-seg two">
              <button type="button" aria-pressed={profile === 'constant'} onClick={() => setProfile('constant')}>Constant speed</button>
              <button type="button" aria-pressed={profile === 'trapezoid'} onClick={() => setProfile('trapezoid')}>Trapezoid</button>
            </div>
          </fieldset>
          <fieldset>
            <legend>
              Event markers <Tip label="About markers">A marker is a name at a position along the path. The robot code decides what the name means, and the names must match exactly, including case. Registered here: {Object.keys(REGISTERED).join(', ')}.</Tip>
            </legend>
            <ul className="lf-pathm-markers">
              {markers.map((m) => (
                <li key={m.id}>
                  <input
                    type="text" list="lf-pathm-names" value={m.name} spellCheck={false}
                    aria-label="Marker name" className={fired(m.id)?.bound ? '' : 'unbound'}
                    onChange={(e) => setMarker(m.id, { name: e.target.value })}
                  />
                  <input
                    type="range" min={0} max={1} step={0.01} value={m.at}
                    aria-label={`${m.name} position along the path`}
                    onChange={(e) => setMarker(m.id, { at: +e.target.value })}
                  />
                  <output>{Math.round(m.at * 100)}%</output>
                  <button type="button" aria-label={`Remove ${m.name}`} onClick={() => setMarkers(markers.filter((x) => x.id !== m.id))}><X size={14} aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
            <datalist id="lf-pathm-names">{Object.keys(REGISTERED).map((n) => <option key={n} value={n} />)}</datalist>
            <button
              type="button" disabled={markers.length >= MAX_MARKERS}
              onClick={() => setMarkers([...markers, { id: nextId.current++, name: markers.some((m) => m.name === 'PREPARE_TO_SHOOT') ? 'STOP_TURRETED_SHOOTING' : 'PREPARE_TO_SHOOT', at: Math.min(0.9, markers.length ? Math.max(...markers.map((m) => m.at)) + 0.3 : 0.4) }])}
            >
              <Plus size={15} aria-hidden="true" />Add marker
            </button>
          </fieldset>
        </div>

        <div className="lf-pg-visual">
          <svg viewBox={`0 0 ${sx(SIZE)} ${sx(SIZE)}`} role="img" aria-label="Field: click to add a waypoint" onClick={onField} className="clickable">
            <rect width={sx(SIZE)} height={sx(SIZE)} className="field" />
            <path d={path.points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join('')} className="route" />
            {waypoints.map((w, i) => (
              <circle
                key={i} cx={sx(w.x)} cy={sy(w.y)} r="5" className="wp"
                onClick={(e) => { e.stopPropagation(); if (waypoints.length > 2) edit(waypoints.filter((_, j) => j !== i)); }}
              >
                <title>Remove waypoint</title>
              </circle>
            ))}
            {markers.map((m) => {
              const p = path.pointAt(m.at * path.length);
              const f = fired(m.id);
              const state = t >= f.time && t > 0 ? (f.bound ? 'hit' : 'miss') : '';
              return <path key={m.id} d={`M${sx(p.x)} ${sy(p.y) - 9}l6 9l-6 9l-6 -9z`} className={`mk ${f.bound ? '' : 'unbound'} ${state}`} />;
            })}
            <g transform={`translate(${sx(here.x)} ${sy(here.y)}) rotate(${-here.angle})`} className="bot">
              <rect x="-10" y="-10" width="20" height="20" rx="3" />
              <line x1="0" y1="0" x2="14" y2="0" />
            </g>
          </svg>
          <div className="lf-pathm-running" aria-live="polite">
            {running.length ? running.map((r) => <span key={r.markerId}>{REGISTERED[r.name as keyof typeof REGISTERED].label} running</span>) : <span className="idle">No mechanism command running</span>}
          </div>
        </div>
      </div>

      <svg viewBox={`-6 0 ${W + 12} 70`} className="lf-pathm-timeline" role="img" aria-label="Timeline of marker firings and mechanism commands">
        <line x1="0" x2={W} y1="30" y2="30" className="axis" />
        {runs.map((r) => (
          <rect key={r.markerId} x={tx(r.start)} y="38" width={Math.max(2, tx(r.end) - tx(r.start))} height="14" rx="3" className="run" />
        ))}
        {firings.map((f) => (
          <g key={f.marker.id} transform={`translate(${tx(f.time)} 30)`} className={`flag ${f.bound ? '' : 'unbound'}`}>
            <line y1="-18" y2="0" />
            <circle cy="-20" r="4" />
          </g>
        ))}
        {duration > 0 && <line x1={tx(t)} x2={tx(t)} y1="4" y2="60" className="cursor" />}
        <text x="0" y="68" className="muted">0 s</text>
        <text x={W} y="68" textAnchor="end" className="muted">{duration.toFixed(1)} s</text>
      </svg>

      <div className="lf-pg-bar">
        <button type="button" onClick={() => { if (done) setT(0); setPlaying(!playing); }} disabled={duration === 0}>
          {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}{playing ? 'Pause' : 'Play'}
        </button>
        <input type="range" min={0} max={duration || 1} step={0.01} value={t} aria-label="Time" onChange={(e) => { setPlaying(false); setT(+e.target.value); }} />
        <output>{t.toFixed(1)} s</output>
        <span className="spacer" />
        <button type="button" onClick={() => edit(DEFAULT_WAYPOINTS)}><RotateCcw size={15} aria-hidden="true" />Reset path</button>
        <button type="button" onClick={() => edit(waypoints.slice(0, 2))}><Trash2 size={15} aria-hidden="true" />Clear</button>
      </div>
    </div>
  );
}
