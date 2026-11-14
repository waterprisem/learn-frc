import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { elevatorPresets, type ElevatorPresetId } from '../../sim/elevatorPresets';
import { ElevatorSim, LOOP_PERIOD, MAX_HEIGHT_METERS, STOW_HEIGHT_METERS, type ElevatorGains, type ElevatorSample } from '../../sim/elevatorSim';
import Chart from '../viz/Chart';
import { elevatorBand, elevatorSeries } from '../viz/elevatorSeries';
import Tasks from './Tasks';

const WINDOW_SECONDS = 10;
const HIGH = 1.05;
// The Lab 6 bindings: no button holds stow, A/B/X/Y hold the four named heights.
const TARGETS = [
  { label: 'Released', hint: '0.02 m', value: STOW_HEIGHT_METERS },
  { label: 'A', hint: '0.18 m', value: 0.18 },
  { label: 'B', hint: '0.42 m', value: 0.42 },
  { label: 'X', hint: '0.72 m', value: 0.72 },
  { label: 'Y', hint: '1.05 m', value: HIGH },
] as const;

type Knob = { key: keyof ElevatorGains; name: string; constant: string; unit: string; min?: number; max: number; step: number };
// Each knob is named after the constant you edit in the lab's Constants.java.
const GROUPS: Array<{ legend: string; knobs: Knob[] }> = [
  {
    legend: 'Profile limits',
    knobs: [
      { key: 'maxVelocity', name: 'Max velocity', constant: 'MAX_VELOCITY_METERS_PER_SECOND', unit: 'm/s', min: 0.1, max: 1.5, step: 0.05 },
      { key: 'maxAcceleration', name: 'Max acceleration', constant: 'MAX_ACCELERATION_METERS_PER_SECOND_SQUARED', unit: 'm/s²', min: 0.2, max: 5, step: 0.1 },
    ],
  },
  {
    legend: 'Feedforward',
    knobs: [
      { key: 'kG', name: 'kG', constant: 'FEEDFORWARD_KG_VOLTS', unit: 'V', max: 2, step: 0.01 },
      { key: 'kV', name: 'kV', constant: 'FEEDFORWARD_KV_VOLTS_PER_METER_PER_SECOND', unit: 'V per m/s', max: 12, step: 0.05 },
      { key: 'kS', name: 'kS', constant: 'FEEDFORWARD_KS_VOLTS', unit: 'V', max: 1, step: 0.01 },
    ],
  },
  {
    legend: 'PID',
    knobs: [
      { key: 'kP', name: 'kP', constant: 'PID_KP', unit: 'V per m of error', max: 100, step: 0.5 },
      { key: 'kD', name: 'kD', constant: 'PID_KD', unit: 'V per m/s', max: 5, step: 0.05 },
    ],
  },
];

// Drawing scale for the mechanism: 0 m at the bottom of the rail, 1.20 m at the top.
const railY = (meters: number) => 236 - (meters / MAX_HEIGHT_METERS) * 210;

interface Props {
  initialPreset?: ElevatorPresetId;
  /** Lesson to mark when the things to try are finished. */
  lessonId?: string;
}

export default function ElevatorTuner({ initialPreset = 'lab', lessonId }: Props) {
  const [gains, setGains] = useState<ElevatorGains>(elevatorPresets[initialPreset].gains);
  const [target, setTarget] = useState<number>(STOW_HEIGHT_METERS);
  const [paused, setPaused] = useState(false);
  const [, setFrame] = useState(0);

  const sim = useRef<ElevatorSim | null>(null);
  if (!sim.current) sim.current = new ElevatorSim(gains);
  const samples = useRef<ElevatorSample[]>([]);
  const live = useRef({ target, paused, gains });
  live.current = { target, paused, gains };
  // What has happened since the current button was pressed, for the things to try.
  const move = useRef({ from: STOW_HEIGHT_METERS, worstError: 0 });
  const seen = useRef({ high: false, slow: false, tracked: false });

  function hold(next: number) {
    move.current = { from: samples.current.at(-1)?.height ?? STOW_HEIGHT_METERS, worstError: 0 };
    setTarget(next);
  }

  const stepOnce = useCallback(() => {
    const s = sim.current!.step(live.current.target);
    const buf = samples.current;
    buf.push(s);
    while (buf.length && buf[0].t < s.t - WINDOW_SECONDS) buf.shift();

    const m = move.current;
    m.worstError = Math.max(m.worstError, Math.abs(s.error));
    if (s.atTarget && s.goal === HIGH) {
      seen.current.high = true;
      if (live.current.gains.maxVelocity <= 0.4) seen.current.slow = true;
      if (m.from < 0.1 && m.worstError < 0.05) seen.current.tracked = true;
    }
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

  function reset(next: ElevatorGains = gains) {
    sim.current = new ElevatorSim(next);
    samples.current = [];
    move.current = { from: STOW_HEIGHT_METERS, worstError: 0 };
    setTarget(STOW_HEIGHT_METERS);
    setGains(next);
    setFrame((f) => f + 1);
  }

  const latest = samples.current[samples.current.length - 1];
  const height = latest?.height ?? STOW_HEIGHT_METERS;
  const presetId = (Object.keys(elevatorPresets) as ElevatorPresetId[]).find((id) =>
    (Object.keys(gains) as Array<keyof ElevatorGains>).every((k) => elevatorPresets[id].gains[k] === gains[k]),
  );

  const knob = (k: Knob) => (
    <label key={k.key} className="lf-knob">
      <span className="name">
        <b>{k.name}</b> <code>{k.constant}</code> <span className="unit">{k.unit}</span>
      </span>
      <input
        type="range" min={k.min ?? 0} max={k.max} step={k.step} value={gains[k.key]}
        aria-label={`${k.name} slider`}
        onChange={(e) => setGains({ ...gains, [k.key]: +e.target.value })}
      />
      <span className="value">
        <input
          type="number" min={k.min ?? 0} step={k.step} value={gains[k.key]}
          aria-label={`${k.name} value`}
          onChange={(e) => setGains({ ...gains, [k.key]: Math.max(k.min ?? 0, +e.target.value || 0) })}
        />
      </span>
    </label>
  );

  return (
    <div className="lf-playground lf-elevator not-content">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Hold Y until At Target turns true', done: seen.current.high },
          { label: 'Lower max velocity to 0.4 and reach Y again', done: seen.current.slow },
          { label: 'Go from stow to Y with the height never more than 5 cm from the profiled setpoint', done: seen.current.tracked },
        ]}
      />
      <div className="lf-pg-top">
        <div className="lf-pg-controls">
          <fieldset>
            <legend>Target height</legend>
            <div className="lf-seg five">
              {TARGETS.map((t) => (
                <button key={t.label} type="button" aria-pressed={target === t.value} onClick={() => hold(t.value)}>
                  <b>{t.label}</b>
                  <small>{t.hint}</small>
                </button>
              ))}
            </div>
          </fieldset>
          {GROUPS.map((g) => (
            <fieldset key={g.legend}>
              <legend>{g.legend}</legend>
              <div className="lf-knob-grid">{g.knobs.map(knob)}</div>
            </fieldset>
          ))}
        </div>

        <div className="lf-pg-visual">
          <svg viewBox="0 0 120 252" role="img" aria-label={`Elevator carriage at ${height.toFixed(2)} meters, target ${target.toFixed(2)} meters`}>
            <rect x="30" y="240" width="74" height="6" className="support" />
            <line x1="44" x2="44" y1={railY(MAX_HEIGHT_METERS) - 14} y2="240" className="rail" />
            <line x1="90" x2="90" y1={railY(MAX_HEIGHT_METERS) - 14} y2="240" className="rail" />
            {TARGETS.slice(1).map((t) => (
              <g key={t.label}>
                <line x1="24" x2="36" y1={railY(t.value)} y2={railY(t.value)} className="tick" />
                <text x="18" y={railY(t.value) + 4} textAnchor="end">{t.label}</text>
              </g>
            ))}
            <rect x="48" y={railY(height) - 11} width="38" height="22" rx="3" className="carriage" />
            <line x1="38" x2="112" y1={railY(latest?.goal ?? target)} y2={railY(latest?.goal ?? target)} className="goal" />
            <line x1="38" x2="112" y1={railY(latest?.setpoint ?? height)} y2={railY(latest?.setpoint ?? height)} className="profile" />
          </svg>
          <div className={`lf-lamp${latest?.atTarget ? ' on' : ''}`}>
            <span aria-hidden="true" /> At Target: <b>{latest?.atTarget ? 'true' : 'false'}</b>
          </div>
        </div>
      </div>

      <Chart
        data={samples.current.slice() as never}
        series={elevatorSeries}
        band={elevatorBand}
        leftLabel="meters"
        rightLabel="volts"
        leftSpan={MAX_HEIGHT_METERS}
        windowSeconds={WINDOW_SECONDS}
        ariaLabel="Live graph of target, profiled setpoint, height and output voltage"
      />

      <div className="lf-pg-bar">
        <label>
          Preset{' '}
          <select value={presetId ?? ''} onChange={(e) => e.target.value && reset(elevatorPresets[e.target.value as ElevatorPresetId].gains)}>
            {!presetId && <option value="">Custom</option>}
            {(Object.keys(elevatorPresets) as ElevatorPresetId[]).map((id) => (
              <option key={id} value={id}>{elevatorPresets[id].label}</option>
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
