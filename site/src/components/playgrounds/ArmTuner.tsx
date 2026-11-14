import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { armPresets, type ArmPresetId } from '../../sim/armPresets';
import { ArmSim, HOME_ANGLE_DEGREES, LOOP_PERIOD, type ArmGains, type ArmSample } from '../../sim/armSim';
import Chart from '../viz/Chart';
import { armBand, armSeries } from '../viz/armSeries';
import Tasks from './Tasks';

const WINDOW_SECONDS = 10;
const HIGH = 95;
// The Lab 7 bindings: no button holds HOME, A/B/Y hold the named angles.
const TARGETS = [
  { label: 'Released', hint: '0° home', value: HOME_ANGLE_DEGREES },
  { label: 'A', hint: '-20°', value: -20 },
  { label: 'B', hint: '35°', value: 35 },
  { label: 'Y', hint: '95°', value: HIGH },
] as const;

type Knob = { key: keyof ArmGains; name: string; constant: string; unit: string; max: number; step: number };
const GROUPS: Array<{ legend: string; knobs: Knob[] }> = [
  {
    legend: 'Profile limits',
    knobs: [
      { key: 'maxVelocity', name: 'Max velocity', constant: 'MAX_VELOCITY_DEGREES_PER_SECOND', unit: '°/s', max: 300, step: 5 },
      { key: 'maxAcceleration', name: 'Max acceleration', constant: 'MAX_ACCELERATION_DEGREES_PER_SECOND_SQUARED', unit: '°/s²', max: 600, step: 10 },
    ],
  },
  {
    legend: 'Feedforward',
    knobs: [
      { key: 'kG', name: 'kG', constant: 'FEEDFORWARD_KG_VOLTS', unit: 'V', max: 1, step: 0.01 },
      { key: 'kV', name: 'kV', constant: 'FEEDFORWARD_KV_VOLTS_PER_RADIAN_PER_SECOND', unit: 'V per rad/s', max: 4, step: 0.05 },
      { key: 'kS', name: 'kS', constant: 'FEEDFORWARD_KS_VOLTS', unit: 'V', max: 1, step: 0.01 },
    ],
  },
  {
    legend: 'PID',
    knobs: [
      { key: 'kP', name: 'kP', constant: 'PID_KP', unit: 'V per degree', max: 3, step: 0.01 },
      { key: 'kD', name: 'kD', constant: 'PID_KD', unit: 'V per °/s', max: 0.2, step: 0.002 },
    ],
  },
];

// Drawing: pivot at (60, 150); the arm is 110 units long, 0° points right.
const PIVOT = { x: 52, y: 150 };
const LENGTH = 100;
const tip = (deg: number, len = LENGTH) => ({
  x: PIVOT.x + len * Math.cos((deg * Math.PI) / 180),
  y: PIVOT.y - len * Math.sin((deg * Math.PI) / 180),
});

interface Props {
  initialPreset?: ArmPresetId;
  /** Lesson to mark when the things to try are finished. */
  lessonId?: string;
}

/** Lab 7 arm: pick an angle, tune the gains, and flip the "forgot Math.toRadians" bug on and off. */
export default function ArmTuner({ initialPreset = 'lab', lessonId }: Props) {
  const [gains, setGains] = useState<ArmGains>(armPresets[initialPreset].gains);
  const [target, setTarget] = useState<number>(HOME_ANGLE_DEGREES);
  const [bug, setBug] = useState(false);
  const [paused, setPaused] = useState(false);
  const [, setFrame] = useState(0);

  const sim = useRef<ArmSim | null>(null);
  if (!sim.current) sim.current = new ArmSim(gains);
  const samples = useRef<ArmSample[]>([]);
  const live = useRef({ target, paused, gains, bug });
  live.current = { target, paused, gains, bug };
  sim.current.radiansBug = bug;
  // What has happened since the current button was pressed, for the things to try.
  const move = useRef({ since: 0, worstGap: 0 });
  const seen = useRef({ high: false, buggy: false, fixed: false });

  function hold(next: number) {
    move.current = { since: sim.current!.t, worstGap: 0 };
    setTarget(next);
  }

  const stepOnce = useCallback(() => {
    const s = sim.current!.step(live.current.target);
    const buf = samples.current;
    buf.push(s);
    while (buf.length && buf[0].t < s.t - WINDOW_SECONDS) buf.shift();

    const m = move.current;
    m.worstGap = Math.max(m.worstGap, Math.abs(s.angle - s.setpoint));
    if (s.atTarget && s.goal === HIGH) seen.current.high = true;
    // The bug shows as the arm straying far from its own profile on the way to Y.
    if (live.current.bug && s.goal === HIGH && s.t - m.since > 1.5 && m.worstGap > 15) seen.current.buggy = true;
    if (!live.current.bug && seen.current.buggy && s.atTarget && s.goal === HIGH) seen.current.fixed = true;
  }, []);

  // Run the robot loop in real time: one 20 ms step per 20 ms of wall-clock time.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let owed = 0;
    const tick = (now: number) => {
      owed = Math.min(owed + (now - last) / 1000, 0.1);
      last = now;
      if (!live.current.paused) {
        while (owed >= LOOP_PERIOD) {
          stepOnce();
          owed -= LOOP_PERIOD;
        }
        setFrame((f) => f + 1);
      } else owed = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stepOnce]);

  useEffect(() => sim.current!.setGains(gains), [gains]);

  function reset(next: ArmGains = gains) {
    sim.current = new ArmSim(next);
    samples.current = [];
    move.current = { since: 0, worstGap: 0 };
    setTarget(HOME_ANGLE_DEGREES);
    setGains(next);
    setFrame((f) => f + 1);
  }

  const latest = samples.current[samples.current.length - 1];
  const angle = latest?.angle ?? HOME_ANGLE_DEGREES;
  const presetId = (Object.keys(armPresets) as ArmPresetId[]).find((id) =>
    (Object.keys(gains) as Array<keyof ArmGains>).every((k) => armPresets[id].gains[k] === gains[k]),
  );

  const knob = (k: Knob) => (
    <label key={k.key} className="lf-knob">
      <span className="name">
        <b>{k.name}</b> <code>{k.constant}</code> <span className="unit">{k.unit}</span>
      </span>
      <input
        type="range" min={0} max={k.max} step={k.step} value={gains[k.key]}
        aria-label={`${k.name} slider`}
        onChange={(e) => setGains({ ...gains, [k.key]: +e.target.value })}
      />
      <span className="value">
        <input
          type="number" min={0} step={k.step} value={gains[k.key]}
          aria-label={`${k.name} value`}
          onChange={(e) => setGains({ ...gains, [k.key]: Math.max(0, +e.target.value || 0) })}
        />
      </span>
    </label>
  );

  const a = tip(angle);
  const g = tip(latest?.goal ?? target, LENGTH + 8);
  const p = tip(latest?.setpoint ?? angle, LENGTH + 8);
  // Gravity pull on the arm: always straight down, with the cos(angle) share drawn as the perpendicular part.
  const gravity = latest?.gravityVolts ?? gains.kG;

  return (
    <div className="lf-playground lf-arm not-content">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Hold Y until At Target turns true', done: seen.current.high },
          { label: 'Turn on the radians bug and send the arm to Y', done: seen.current.buggy },
          { label: 'Turn the bug off and reach Y again', done: seen.current.fixed },
        ]}
      />
      <div className="lf-pg-top">
        <div className="lf-pg-controls">
          <fieldset>
            <legend>Target angle</legend>
            <div className="lf-seg four">
              {TARGETS.map((t) => (
                <button key={t.label} type="button" aria-pressed={target === t.value} onClick={() => hold(t.value)}>
                  <b>{t.label}</b>
                  <small>{t.hint}</small>
                </button>
              ))}
            </div>
          </fieldset>
          {GROUPS.map((gr) => (
            <fieldset key={gr.legend}>
              <legend>{gr.legend}</legend>
              <div className="lf-knob-grid">{gr.knobs.map(knob)}</div>
            </fieldset>
          ))}
          <label className="lf-check">
            <input type="checkbox" checked={bug} onChange={(e) => setBug(e.target.checked)} />
            Feedforward gets degrees (no <code>Math.toRadians</code>)
          </label>
        </div>

        <div className="lf-pg-visual">
          <svg viewBox="0 0 170 190" role="img" aria-label={`Arm at ${angle.toFixed(0)} degrees, target ${target} degrees`}>
            <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x + LENGTH + 12} y2={PIVOT.y} className="horizon" />
            <line x1={PIVOT.x} y1={PIVOT.y} x2={g.x} y2={g.y} className="goal" />
            <line x1={PIVOT.x} y1={PIVOT.y} x2={p.x} y2={p.y} className="profile" />
            <line x1={PIVOT.x} y1={PIVOT.y} x2={a.x} y2={a.y} className="link" />
            <circle cx={a.x} cy={a.y} r="6" className="tipdot" />
            <circle cx={PIVOT.x} cy={PIVOT.y} r="6" className="hub" />
            <text x={PIVOT.x + LENGTH + 14} y={PIVOT.y + 4}>0°</text>
          </svg>
          <div className="lf-grav" aria-label={`Gravity feedforward ${gravity.toFixed(2)} volts`}>
            <span>kG·cos(angle)</span>
            <div className="bar"><i style={{ width: `${Math.max(0, Math.min(1, Math.abs(gravity) / Math.max(gains.kG, 0.01))) * 100}%` }} /></div>
            <b>{gravity.toFixed(2)} V</b>
          </div>
          <div className={`lf-lamp${latest?.atTarget ? ' on' : ''}`}>
            <span aria-hidden="true" /> At Target: <b>{latest?.atTarget ? 'true' : 'false'}</b>
          </div>
        </div>
      </div>

      <Chart
        data={samples.current.slice() as never}
        series={armSeries}
        band={armBand}
        leftLabel="degrees"
        rightLabel="volts"
        leftSpan={140}
        windowSeconds={WINDOW_SECONDS}
        ariaLabel="Live graph of target, profiled setpoint, angle and output voltage"
      />

      <div className="lf-pg-bar">
        <label>
          Preset{' '}
          <select value={presetId ?? ''} onChange={(e) => e.target.value && reset(armPresets[e.target.value as ArmPresetId].gains)}>
            {!presetId && <option value="">Custom</option>}
            {(Object.keys(armPresets) as ArmPresetId[]).map((id) => (
              <option key={id} value={id}>{armPresets[id].label}</option>
            ))}
          </select>
        </label>
        <span className="spacer" />
        <button type="button" onClick={() => setPaused(!paused)}>{paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}{paused ? 'Resume' : 'Pause'}</button>
        <button type="button" disabled={!paused} onClick={() => { stepOnce(); setFrame((f) => f + 1); }}><StepForward size={15} aria-hidden="true" />Step 20 ms</button>
        <button type="button" onClick={() => reset()}><RotateCcw size={15} aria-hidden="true" />Reset</button>
      </div>
    </div>
  );
}
