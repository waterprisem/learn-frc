import { EyeOff, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AlignRun, LOOP_PERIOD, STALE_SECONDS, TAG_POSE, TARGET, type AlignGains, type AlignSample } from '../../sim/vision/alignToTag';
import Chart from '../viz/Chart';
import type { ChartSeries } from '../viz/Chart';
import Tip from '../viz/Tip';
import Tasks from './Tasks';

const PX = 50;
const SIZE = 6;
const WINDOW_SECONDS = 10;
const sx = (m: number) => m * PX;
const sy = (m: number) => (SIZE - m) * PX;

const series: ChartSeries[] = [
  { key: 'errorX', label: 'x error', unit: 'm', cssVar: '--sig-error', width: 2 },
  { key: 'errorY', label: 'y error', unit: 'm', cssVar: '--sig-profile', width: 2 },
  { key: 'errorRot', label: 'Rotation error', unit: 'rad', cssVar: '--sig-measurement', width: 2 },
  { key: 'speed', label: 'Speed request', unit: 'm/s', cssVar: '--sig-output', dash: '2 3', axis: 'right' },
];
const band = { key: 'aligned', label: 'Aligned' };

const knobs: Array<{ key: keyof AlignGains; name: string; constant: string }> = [
  { key: 'x', name: 'x kP', constant: 'xPID' },
  { key: 'y', name: 'y kP', constant: 'yPID' },
  { key: 'rot', name: 'Rotation kP', constant: 'rotPID' },
];

/** Three PID loops drive the robot to 0.5 m in front of a tag; cover the tag and the command stops. */
export default function AlignToTag({ lessonId }: { lessonId?: string }) {
  const [gains, setGains] = useState<AlignGains>({ x: 2.5, y: 2.5, rot: 3 });
  const [covered, setCovered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [, setFrame] = useState(0);

  const run = useRef(new AlignRun(gains));
  const rows = useRef<Array<AlignSample & { speed: number }>>([]);
  const live = useRef({ covered, paused, gains });
  live.current = { covered, paused, gains };
  const seen = useRef({ aligned: false, stopped: false, resumed: false });

  useEffect(() => run.current.setGains(gains), [gains]);

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    let owed = 0;
    const tick = (now: number) => {
      owed = Math.min(owed + (now - prev) / 1000, 0.1);
      prev = now;
      if (!live.current.paused) {
        while (owed >= LOOP_PERIOD) {
          const s = run.current.step(!live.current.covered);
          const buf = rows.current;
          buf.push({ ...s, speed: Math.hypot(s.vx, s.vy) });
          while (buf.length && buf[0].t < s.t - WINDOW_SECONDS) buf.shift();
          if (s.aligned) seen.current.aligned = true;
          if (s.stopped && live.current.covered && s.vx === 0 && s.vy === 0 && s.omega === 0 && !s.aligned) seen.current.stopped = true;
          if (seen.current.stopped && !s.stopped && !live.current.covered && s.aligned) seen.current.resumed = true;
          owed -= LOOP_PERIOD;
        }
        setFrame((f) => f + 1);
      } else owed = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function restart() {
    run.current = new AlignRun(gains);
    rows.current = [];
    setCovered(false);
    setFrame((f) => f + 1);
  }

  const last = rows.current[rows.current.length - 1];
  const pose = last?.pose ?? run.current.pose;
  const state = last?.aligned ? 'aligned' : last?.stopped ? 'stopped' : 'aligning';

  return (
    <div className="lf-playground lf-align not-content">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Reach the target with all three errors inside tolerance', done: seen.current.aligned },
          { label: 'Cover the tag mid-drive and watch the speed request fall to zero', done: seen.current.stopped },
          { label: 'Restart, cover the tag briefly, uncover it and finish the alignment', done: seen.current.resumed },
        ]}
      />
      <div className="lf-pg-top lf-align-top">
        <div className="lf-pg-controls">
          <fieldset>
            <legend>PID gains</legend>
            <div className="lf-knob-grid">
              {knobs.map((k) => (
                <label key={k.key} className="lf-knob">
                  <span className="name"><b>{k.name}</b> <code>{k.constant}</code></span>
                  <input type="range" min={0} max={8} step={0.1} value={gains[k.key]} aria-label={`${k.name} slider`} onChange={(e) => setGains({ ...gains, [k.key]: +e.target.value })} />
                  <span className="value">
                    <input type="number" min={0} step={0.1} value={gains[k.key]} aria-label={`${k.name} value`} onChange={(e) => setGains({ ...gains, [k.key]: Math.max(0, +e.target.value || 0) })} />
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="lf-check">
            <input type="checkbox" checked={covered} onChange={(e) => setCovered(e.target.checked)} />
            <EyeOff size={15} aria-hidden="true" /> Cover the tag
          </label>
          <div className="lf-align-state">
          <div className={`lf-lamp ${state === 'aligned' ? 'on' : ''}`} role="status">
            <span aria-hidden="true" />
            {state === 'aligned' && 'Aligned, command finished'}
            {state === 'stopped' && 'No vision, stopped'}
            {state === 'aligning' && 'Aligning'}
          </div>
            <Tip label="About the stop">Tolerance is 2 cm and 2°. With no tag measurement for more than {STALE_SECONDS} s the command outputs zero.</Tip>
          </div>
        </div>

        <div className="lf-pg-visual">
          <svg viewBox={`0 0 ${sx(SIZE)} ${sx(SIZE)}`} role="img" aria-label={`Robot at ${pose.x.toFixed(2)}, ${pose.y.toFixed(2)} heading ${pose.heading.toFixed(0)} degrees; target in front of the tag`}>
            <rect width={sx(SIZE)} height={sx(SIZE)} className="field" />
            <g transform={`translate(${sx(TARGET.x)} ${sy(TARGET.y)}) rotate(${-TARGET.heading})`} className="goal">
              <rect x="-14" y="-14" width="28" height="28" rx="3" />
              <line x1="0" y1="0" x2="18" y2="0" />
            </g>
            <g className={`tag${covered ? ' covered' : ''}`} transform={`translate(${sx(TAG_POSE.x)} ${sy(TAG_POSE.y)})`}>
              <rect x="-16" y="-3" width="32" height="6" />
              {covered && <line x1="-18" y1="-7" x2="18" y2="7" />}
            </g>
            {!covered && <line x1={sx(pose.x)} y1={sy(pose.y)} x2={sx(TAG_POSE.x)} y2={sy(TAG_POSE.y)} className="sight" />}
            <g transform={`translate(${sx(pose.x)} ${sy(pose.y)}) rotate(${-pose.heading})`} className="bot">
              <rect x="-14" y="-14" width="28" height="28" rx="3" />
              <line x1="0" y1="0" x2="18" y2="0" />
            </g>
          </svg>
        </div>
      </div>

      <Chart
        data={rows.current.slice() as never}
        series={series}
        band={band}
        leftLabel="meters, radians"
        rightLabel="m/s"
        leftSpan={1}
        rightSpan={2}
        windowSeconds={WINDOW_SECONDS}
        ariaLabel="Live graph of the x, y and rotation errors and the speed request"
      />

      <div className="lf-pg-bar">
        <span className="spacer" />
        <button type="button" onClick={() => setPaused(!paused)}>{paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}{paused ? 'Resume' : 'Pause'}</button>
        <button type="button" onClick={restart}><RotateCcw size={15} aria-hidden="true" />Restart</button>
      </div>
    </div>
  );
}
