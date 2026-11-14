import { Pause, Play, RotateCcw, Shuffle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CORNERS, DriftRun, TAG, type DriftConfig, type DriftSample } from '../../sim/swerve/odometry';
import { FIELD_SIZE_METERS, LOOP_PERIOD } from '../../sim/swerve/swerveSim';
import Chart from '../viz/Chart';
import type { ChartSeries } from '../viz/Chart';
import Tip from '../viz/Tip';
import Tasks from './Tasks';

const PX = 50;
const WINDOW_SECONDS = 30;
const TRAIL = 600;
const errorSeries: ChartSeries[] = [{ key: 'error', label: 'Position error', unit: 'm', cssVar: '--sig-error', width: 2.5 }];
const sx = (m: number) => m * PX;
const sy = (m: number) => (FIELD_SIZE_METERS - m) * PX;

interface Props {
  /** drift: odometry only (lesson 6.5). vision: adds AprilTag corrections and the ambiguity limit (lesson 7.2). */
  mode?: 'drift' | 'vision';
  lessonId?: string;
}

/** A robot drives a loop on odometry alone, and optionally with vision measurements pulling the pose back. */
export default function OdometryDrift({ mode = 'drift', lessonId }: Props) {
  const withVision = mode === 'vision';
  const [seed, setSeed] = useState(7);
  const [slip, setSlip] = useState(withVision ? 0.1 : 0.08);
  const [gyro, setGyro] = useState(withVision ? 0.3 : 0.2);
  const [vision, setVision] = useState(withVision);
  const [threshold, setThreshold] = useState(0.2);
  const [paused, setPaused] = useState(false);
  const [, setFrame] = useState(0);

  const config = useRef<DriftConfig>({ seed, slip, gyroDrift: gyro, vision, ambiguityThreshold: threshold });
  config.current.slip = slip;
  config.current.gyroDrift = gyro;
  config.current.vision = vision;
  config.current.ambiguityThreshold = threshold;

  const run = useRef(new DriftRun(config.current));
  const samples = useRef<DriftSample[]>([]);
  const events = useRef<Array<{ x: number; y: number; accepted: boolean; t: number }>>([]);
  const trail = useRef<Array<{ t: DriftSample['truth']; e: DriftSample['estimate'] }>>([]);
  const live = useRef({ paused });
  live.current = { paused };
  const seen = useRef({ far: false, gyroOnly: false, snap: false, jump: false, rejected: false });

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    let owed = 0;
    let n = 0;
    const tick = (now: number) => {
      owed = Math.min(owed + (now - prev) / 1000, 0.1);
      prev = now;
      if (!live.current.paused) {
        while (owed >= LOOP_PERIOD) {
          const s = run.current.step();
          const buf = samples.current;
          buf.push(s);
          while (buf.length && buf[0].t < s.t - WINDOW_SECONDS) buf.shift();
          if (++n % 4 === 0) {
            trail.current.push({ t: s.truth, e: s.estimate });
            if (trail.current.length > TRAIL) trail.current.shift();
          }
          const c = config.current;
          if (s.error > 0.5) seen.current.far = true;
          if (s.error > 0.2 && c.slip === 0 && c.gyroDrift > 0) seen.current.gyroOnly = true;
          const ev = s.event;
          if (ev) {
            events.current.push({ x: ev.measured.x, y: ev.measured.y, accepted: ev.accepted, t: s.t });
            if (events.current.length > 12) events.current.shift();
            if (ev.accepted && ev.errorBefore - ev.errorAfter > 0.08) seen.current.snap = true;
            if (ev.accepted && ev.ambiguity > 0.2 && ev.errorAfter - ev.errorBefore > 0.05) seen.current.jump = true;
            if (!ev.accepted && ev.ambiguity > c.ambiguityThreshold && c.ambiguityThreshold <= 0.2) seen.current.rejected = true;
          }
          owed -= LOOP_PERIOD;
        }
        setFrame((f) => f + 1);
      } else owed = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function restart(nextSeed = seed) {
    config.current.seed = nextSeed;
    run.current = new DriftRun(config.current);
    samples.current = [];
    events.current = [];
    trail.current = [];
    setSeed(nextSeed);
    setFrame((f) => f + 1);
  }

  const last = samples.current[samples.current.length - 1];
  const path = (pick: 't' | 'e') => trail.current.map((p, i) => `${i ? 'L' : 'M'}${sx(p[pick].x).toFixed(1)} ${sy(p[pick].y).toFixed(1)}`).join('');
  const robot = (p: DriftSample['truth'], cls: string) => (
    <g className={cls} transform={`translate(${sx(p.x)} ${sy(p.y)}) rotate(${-p.heading})`}>
      <rect x="-9" y="-9" width="18" height="18" rx="3" />
      <line x1="0" y1="0" x2="13" y2="0" />
    </g>
  );

  const tasks = withVision
    ? [
        { label: 'Watch an accepted measurement pull the pose back', done: seen.current.snap },
        { label: 'Set the limit to 1 and catch a bad measurement moving the pose', done: seen.current.jump },
        { label: 'Return to 0.2 and see a measurement rejected', done: seen.current.rejected },
      ]
    : [
        { label: 'Let the error grow past 0.5 m', done: seen.current.far },
        { label: 'Set wheel slip to 0 and still get 0.2 m of error from the gyro', done: seen.current.gyroOnly },
      ];

  return (
    <div className="lf-playground lf-odo not-content">
      <Tasks lessonId={lessonId} tasks={tasks} />
      <div className="lf-pg-top lf-odo-top">
        <div className="lf-pg-controls">
          <fieldset>
            <legend>Odometry error sources</legend>
            <div className="lf-knob-grid">
              <label className="lf-knob">
                <span className="name"><b>Wheel slip</b> <span className="unit">encoder over-reads</span></span>
                <input type="range" min={0} max={0.2} step={0.01} value={slip} aria-label="Wheel slip slider" onChange={(e) => setSlip(+e.target.value)} />
                <span className="value"><output>{Math.round(slip * 100)}%</output></span>
              </label>
              <label className="lf-knob">
                <span className="name"><b>Gyro drift</b> <span className="unit">°/s</span></span>
                <input type="range" min={0} max={1} step={0.05} value={gyro} aria-label="Gyro drift slider" onChange={(e) => setGyro(+e.target.value)} />
                <span className="value"><output>{gyro.toFixed(2)}</output></span>
              </label>
            </div>
          </fieldset>
          {withVision && (
            <fieldset>
              <legend>Vision</legend>
              <label className="lf-check">
                <input type="checkbox" checked={vision} onChange={(e) => setVision(e.target.checked)} />
                Add vision measurements
              </label>
              <label className="lf-knob">
                <span className="name">
                  <b>Ambiguity limit</b> <Tip label="About the limit">The team's OrbitCamera ignores any tag with ambiguity above 0.2. A high ambiguity can mean the mirror-image answer.</Tip>
                </span>
                <input type="range" min={0} max={1} step={0.05} value={threshold} disabled={!vision} aria-label="Ambiguity limit slider" onChange={(e) => setThreshold(+e.target.value)} />
                <span className="value"><output>{threshold.toFixed(2)}</output></span>
              </label>
            </fieldset>
          )}
        </div>

        <div className="lf-pg-visual">
          <svg viewBox={`0 0 ${sx(FIELD_SIZE_METERS)} ${sx(FIELD_SIZE_METERS)}`} role="img" aria-label={`Field: the true robot and its estimated pose, ${last ? last.error.toFixed(2) : '0'} meters apart`}>
            <rect width={sx(FIELD_SIZE_METERS)} height={sx(FIELD_SIZE_METERS)} className="field" />
            <polygon points={CORNERS.map((c) => `${sx(c.x)},${sy(c.y)}`).join(' ')} className="loop" />
            {vision && (
              <g className="tag"><rect x={sx(TAG.x) - 14} y={sy(TAG.y) - 3} width="28" height="6" /></g>
            )}
            <path d={path('t')} className="trail truth" />
            <path d={path('e')} className="trail est" />
            {events.current.map((e) => (
              e.accepted
                ? <circle key={e.t} cx={sx(e.x)} cy={sy(e.y)} r="4" className="vis ok" />
                : <path key={e.t} d={`M${sx(e.x) - 4} ${sy(e.y) - 4}l8 8m0 -8l-8 8`} className="vis no" />
            ))}
            {last && robot(last.truth, 'bot truth')}
            {last && robot(last.estimate, 'bot est')}
          </svg>
          <div className="lf-odo-key">
            <span><i className="truth" />Truth</span>
            <span><i className="est" />Estimate</span>
            {vision && <span><i className="ok" />Used</span>}
            {vision && <span><i className="no" />Rejected</span>}
          </div>
        </div>
      </div>

      <Chart
        data={samples.current.slice() as never}
        series={errorSeries}
        leftLabel="meters"
        leftSpan={0.5}
        windowSeconds={WINDOW_SECONDS}
        ariaLabel="Live graph of the distance between the estimated and the true position"
      />

      <div className="lf-pg-bar">
        <span className="spacer" />
        <button type="button" onClick={() => setPaused(!paused)}>{paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}{paused ? 'Resume' : 'Pause'}</button>
        <button type="button" onClick={() => restart(seed + 1)}><Shuffle size={15} aria-hidden="true" />New noise</button>
        <button type="button" onClick={() => restart()}><RotateCcw size={15} aria-hidden="true" />Reset</button>
      </div>
    </div>
  );
}
