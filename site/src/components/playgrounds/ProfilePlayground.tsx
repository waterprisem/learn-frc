import { useMemo, useRef, useState } from 'react';
import { TrapezoidProfile } from '../../sim/control/TrapezoidProfile';
import Chart, { type ChartSeries } from '../viz/Chart';
import Tasks from './Tasks';

const series: ChartSeries[] = [
  { key: 'position', label: 'Setpoint position', unit: 'm', cssVar: '--sig-profile', dash: '2 3', width: 2.5 },
  { key: 'velocity', label: 'Setpoint velocity', unit: 'm/s', cssVar: '--sl-color-gray-2', axis: 'right' },
];

const KNOBS = [
  { key: 'distance', name: 'Distance', unit: 'm', min: 0.05, max: 1.2, step: 0.05 },
  { key: 'maxVelocity', name: 'Max velocity', unit: 'm/s', min: 0.1, max: 2, step: 0.05 },
  { key: 'maxAcceleration', name: 'Max acceleration', unit: 'm/s²', min: 0.2, max: 5, step: 0.1 },
] as const;

type Move = Record<(typeof KNOBS)[number]['key'], number>;

/** Set the two limits and a distance; see the plan a TrapezoidProfile makes. Starts on the lesson's worked move. */
export default function ProfilePlayground({ lessonId }: { lessonId?: string }) {
  const [move, setMove] = useState<Move>({ distance: 1, maxVelocity: 1, maxAcceleration: 2 });
  const seen = useRef({ triangle: false, fast: false });

  const plan = useMemo(() => {
    const profile = new TrapezoidProfile({ maxVelocity: move.maxVelocity, maxAcceleration: move.maxAcceleration });
    const start = { position: 0, velocity: 0 };
    const goal = { position: move.distance, velocity: 0 };
    profile.calculate(0, start, goal);
    const { endAccel, endFullSpeed, endDecel } = profile.phases();
    const data = [];
    for (let t = 0; t < endDecel + 0.2; t += 0.02) data.push({ t, ...profile.calculate(t, start, goal) });
    return { data, accel: endAccel, cruise: endFullSpeed - endAccel, total: endDecel, peak: profile.calculate(endAccel, start, goal).velocity };
  }, [move]);

  const triangle = plan.cruise < 1e-9;
  if (triangle) seen.current.triangle = true;
  if (move.distance === 1 && plan.total < 1.2) seen.current.fast = true;

  return (
    <div className="lf-playground lf-profile not-content">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Make a move with no cruise phase', done: seen.current.triangle },
          { label: 'Make a 1.0 m move take less than 1.2 s', done: seen.current.fast },
        ]}
      />
      <div className="lf-knob-grid">
        {KNOBS.map((k) => (
          <label key={k.key} className="lf-knob">
            <span className="name"><b>{k.name}</b> <span className="unit">{k.unit}</span></span>
            <input
              type="range" min={k.min} max={k.max} step={k.step} value={move[k.key]}
              aria-label={`${k.name} slider`}
              onChange={(e) => setMove({ ...move, [k.key]: +e.target.value })}
            />
            <span className="value">
              <input
                type="number" min={k.min} max={k.max} step={k.step} value={move[k.key]}
                aria-label={`${k.name} value`}
                onChange={(e) => setMove({ ...move, [k.key]: Math.min(k.max, Math.max(k.min, +e.target.value || k.min)) })}
              />
            </span>
          </label>
        ))}
      </div>

      <Chart
        data={plan.data as never}
        series={series}
        leftLabel="meters"
        rightLabel="m/s"
        leftSpan={0.2}
        rightSpan={0.5}
        ariaLabel={`Profile for a ${move.distance} meter move: setpoint position and velocity over time`}
      />

      <dl className="lf-phases" aria-live="polite">
        <div><dt>Accelerate</dt><dd>{plan.accel.toFixed(2)} s</dd></div>
        <div className={triangle ? 'none' : ''}><dt>Cruise</dt><dd>{triangle ? 'none' : `${plan.cruise.toFixed(2)} s`}</dd></div>
        <div><dt>Decelerate</dt><dd>{plan.accel.toFixed(2)} s</dd></div>
        <div><dt>Total</dt><dd>{plan.total.toFixed(2)} s</dd></div>
        <div><dt>Peak velocity</dt><dd>{plan.peak.toFixed(2)} m/s</dd></div>
        <div><dt>Shape</dt><dd>{triangle ? 'Triangle' : 'Trapezoid'}</dd></div>
      </dl>
    </div>
  );
}
