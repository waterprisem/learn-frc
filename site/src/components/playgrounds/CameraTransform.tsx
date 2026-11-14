import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { REAL_MOUNT, sampleAt, TAG, type Mount, type Pose2, type TransformSample } from '../../sim/vision/cameraTransform';
import Chart from '../viz/Chart';
import type { ChartSeries } from '../viz/Chart';
import Tip from '../viz/Tip';
import Tasks from './Tasks';

const PX = 50;
const SIZE = 6;
const WINDOW_SECONDS = 20;
const sx = (m: number) => m * PX;
const sy = (m: number) => (SIZE - m) * PX;
const series: ChartSeries[] = [
  { key: 'errorX', label: 'Pose error x', unit: 'm', cssVar: '--sig-error', width: 2.5 },
  { key: 'errorY', label: 'Pose error y', unit: 'm', cssVar: '--sig-profile', width: 2.5 },
];

const knobs: Array<{ key: keyof Mount; name: string; unit: string; min: number; max: number; step: number }> = [
  { key: 'x', name: 'x (forward)', unit: 'm', min: -0.5, max: 0.5, step: 0.01 },
  { key: 'y', name: 'y (left)', unit: 'm', min: -0.5, max: 0.5, step: 0.01 },
  { key: 'heading', name: 'yaw', unit: '°', min: -90, max: 90, step: 1 },
];

const at = (p: Pose2) => `translate(${sx(p.x)} ${sy(p.y)}) rotate(${-p.heading})`;

/** Enter the robot-to-camera transform and watch the estimated robot pose go wrong when it does not match the real mount. */
export default function CameraTransform({ lessonId }: { lessonId?: string }) {
  const [mount, setMount] = useState<Mount>({ x: 0, y: 0, heading: 0 });
  const [paused, setPaused] = useState(false);
  const [, setFrame] = useState(0);
  const clock = useRef(0);
  const rows = useRef<Array<{ t: number; errorX: number; errorY: number }>>([]);
  const live = useRef({ mount, paused });
  live.current = { mount, paused };
  const seen = useRef({ wrong: false, yaw: false, fixed: false });

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.1);
      prev = now;
      if (!live.current.paused) {
        clock.current += dt;
        const s = sampleAt(clock.current, live.current.mount);
        rows.current.push({ t: clock.current, errorX: s.errorX, errorY: s.errorY });
        while (rows.current.length && rows.current[0].t < clock.current - WINDOW_SECONDS) rows.current.shift();
        if (s.error > 0.1) seen.current.wrong = true;
        if (Math.abs(s.headingError) > 3) seen.current.yaw = true;
        if (seen.current.wrong && s.error < 0.01 && Math.abs(s.headingError) < 0.5) seen.current.fixed = true;
        setFrame((f) => f + 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const s: TransformSample = sampleAt(clock.current, mount);
  const robot = (p: Pose2, cls: string, m: Mount) => (
    <g className={cls} transform={at(p)}>
      <rect x="-14" y="-14" width="28" height="28" rx="3" />
      <g transform={`translate(${sx(m.x)} ${-sx(m.y)}) rotate(${-m.heading})`} className="cam">
        <polygon points="0,-5 10,0 0,5" />
      </g>
    </g>
  );

  return (
    <div className="lf-playground lf-cam not-content">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Make the pose wrong by more than 10 cm', done: seen.current.wrong },
          { label: 'Get the yaw wrong by 3° or more', done: seen.current.yaw },
          { label: 'Match the real mount until the pose is right again', done: seen.current.fixed },
        ]}
      />
      <div className="lf-pg-top lf-cam-top">
        <div className="lf-pg-controls">
          <fieldset>
            <legend>
              Robot-to-camera transform <Tip label="About the transform">Real mount: x {REAL_MOUNT.x} m, y {REAL_MOUNT.y} m, yaw {REAL_MOUNT.heading}°. The camera triangle shows where each transform puts the camera.</Tip>
            </legend>
            <div className="lf-knob-grid">
              {knobs.map((k) => (
                <label key={k.key} className="lf-knob">
                  <span className="name"><b>{k.name}</b> <span className="unit">{k.unit}</span></span>
                  <input
                    type="range" min={k.min} max={k.max} step={k.step} value={mount[k.key]}
                    aria-label={`${k.name} slider`}
                    onChange={(e) => setMount({ ...mount, [k.key]: +e.target.value })}
                  />
                  <span className="value">
                    <input
                      type="number" min={k.min} max={k.max} step={k.step} value={mount[k.key]}
                      aria-label={`${k.name} value`}
                      onChange={(e) => setMount({ ...mount, [k.key]: +e.target.value || 0 })}
                    />
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <dl className="lf-cam-read" aria-live="off">
            <div><dt>Position off by</dt><dd>{(s.error * 100).toFixed(0)} cm</dd></div>
            <div><dt>Heading off by</dt><dd>{s.headingError.toFixed(1)}°</dd></div>
          </dl>
        </div>

        <div className="lf-pg-visual">
          <svg viewBox={`0 0 ${sx(SIZE)} ${sx(SIZE)}`} role="img" aria-label={`Field with the true robot and the estimated robot ${(s.error * 100).toFixed(0)} centimeters apart`}>
            <rect width={sx(SIZE)} height={sx(SIZE)} className="field" />
            <g transform={at(TAG)} className="tag"><rect x="-14" y="-3" width="28" height="6" /></g>
            <line x1={sx(s.camera.x)} y1={sy(s.camera.y)} x2={sx(TAG.x)} y2={sy(TAG.y)} className="sight" />
            {robot(s.truth, 'bot truth', REAL_MOUNT)}
            {robot(s.estimate, 'bot est', mount)}
          </svg>
          <div className="lf-odo-key">
            <span><i className="truth" />True robot</span>
            <span><i className="est" />Estimated robot</span>
          </div>
        </div>
      </div>

      <Chart
        data={rows.current.slice() as never}
        series={series}
        leftLabel="meters"
        leftSpan={0.2}
        windowSeconds={WINDOW_SECONDS}
        ariaLabel="Live graph of the x and y error of the estimated robot pose"
      />

      <div className="lf-pg-bar">
        <button type="button" onClick={() => setMount(REAL_MOUNT)}>Use real mount</button>
        <span className="spacer" />
        <button type="button" onClick={() => setPaused(!paused)}>{paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}{paused ? 'Resume' : 'Pause'}</button>
        <button type="button" onClick={() => { clock.current = 0; rows.current = []; setMount({ x: 0, y: 0, heading: 0 }); }}><RotateCcw size={15} aria-hidden="true" />Reset</button>
      </div>
    </div>
  );
}
