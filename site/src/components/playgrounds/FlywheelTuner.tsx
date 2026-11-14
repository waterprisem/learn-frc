import { Compass, Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flywheelPresets, type FlywheelPresetId } from '../../sim/flywheelPresets';
import { FlywheelSim, LOOP_PERIOD, type FlywheelGains, type FlywheelSample } from '../../sim/flywheelSim';
import Chart from '../viz/Chart';
import { flywheelBand, flywheelSeries } from '../viz/flywheelSeries';
import { updateLesson } from '../../stores/progress';
import Coach from './Coach';
import { buildGuideContext, flywheelGuide } from './flywheelGuide';

const WINDOW_SECONDS = 10;
const TARGETS = [
  { label: 'Released', hint: '0 V, coasts', value: null },
  { label: 'A', hint: '20 RPS', value: 20 },
  { label: 'B', hint: '40 RPS', value: 40 },
  { label: 'Y', hint: '70 RPS', value: 70 },
] as const;

// Each knob is named after the constant you edit in the lab's Constants.java.
const KNOBS: Array<{ key: keyof FlywheelGains; constant: string; unit: string; max: number; step: number; advanced?: boolean }> = [
  { key: 'kS', constant: 'FEEDFORWARD_KS_VOLTS', unit: 'V', max: 1, step: 0.01 },
  { key: 'kV', constant: 'FEEDFORWARD_KV_VOLTS_PER_RPS', unit: 'V per RPS', max: 0.25, step: 0.005 },
  { key: 'kP', constant: 'PID_KP', unit: 'V per RPS of error', max: 3, step: 0.01 },
  { key: 'kI', constant: 'PID_KI', unit: 'V per RPS·s', max: 2, step: 0.01, advanced: true },
  { key: 'kD', constant: 'PID_KD', unit: 'V per RPS/s', max: 0.02, step: 0.0005, advanced: true },
];

interface Props {
  initialPreset?: FlywheelPresetId;
  /** Lesson to mark when the guided steps are finished. */
  lessonId?: string;
  /** Set to false to show the playground without the guided steps. */
  guide?: boolean;
}

export default function FlywheelTuner({ initialPreset = 'zero', lessonId, guide: showGuide = true }: Props) {
  const [gains, setGains] = useState<FlywheelGains>(flywheelPresets[initialPreset].gains);
  const [target, setTarget] = useState<number | null>(null);
  const [load, setLoad] = useState(false);
  const [paused, setPaused] = useState(false);
  const [, setFrame] = useState(0);

  const sim = useRef<FlywheelSim | null>(null);
  if (!sim.current) sim.current = new FlywheelSim(gains);
  const samples = useRef<FlywheelSample[]>([]);
  const live = useRef({ target, paused });
  live.current = { target, paused };
  const targetSince = useRef(0);

  function hold(next: number | null) {
    targetSince.current = sim.current!.t;
    setTarget(next);
  }

  const stepOnce = useCallback(() => {
    const s = sim.current!.step(live.current.target);
    const buf = samples.current;
    buf.push(s);
    while (buf.length && buf[0].t < s.t - WINDOW_SECONDS) buf.shift();
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
  useEffect(() => {
    sim.current!.plant.loadVolts = load ? 0.5 : 0;
  }, [load]);

  function reset(next: FlywheelGains = gains) {
    sim.current = new FlywheelSim(next, load ? 0.5 : 0);
    samples.current = [];
    targetSince.current = 0;
    setTarget(null);
    setGains(next);
    setFrame((f) => f + 1);
  }

  const latest = samples.current[samples.current.length - 1];
  const angle = (sim.current.plant.positionRotations * 360) % 360;
  const presetId = (Object.keys(flywheelPresets) as FlywheelPresetId[]).find((id) =>
    KNOBS.every((k) => flywheelPresets[id].gains[k.key] === gains[k.key]),
  );

  const guide = buildGuideContext(samples.current, gains, target, load, sim.current.t - targetSince.current);

  const knob = (k: (typeof KNOBS)[number]) => (
    <label key={k.key} className="lf-knob">
      <span className="name">
        <b>{k.key}</b> <code>{k.constant}</code> <span className="unit">{k.unit}</span>
      </span>
      <input
        type="range" min={0} max={k.max} step={k.step} value={gains[k.key]}
        aria-label={`${k.key} slider`}
        onChange={(e) => setGains({ ...gains, [k.key]: +e.target.value })}
      />
      <span className="value">
        <input
          type="number" min={0} step={k.step} value={gains[k.key]}
          aria-label={`${k.key} value`}
          onChange={(e) => setGains({ ...gains, [k.key]: Math.max(0, +e.target.value || 0) })}
        />
      </span>
    </label>
  );

  return (
    <div className="lf-playground not-content">
      {showGuide && (
        <Coach
          icon={<Compass size={18} aria-hidden="true" />}
          steps={flywheelGuide}
          context={guide}
          onFinish={() => lessonId && updateLesson(lessonId, { guideDone: true })}
        />
      )}
      <div className="lf-pg-top">
        <div className="lf-pg-controls">
          <fieldset>
            <legend>Target speed</legend>
            <div className="lf-seg">
              {TARGETS.map((t) => (
                <button key={t.label} type="button" aria-pressed={target === t.value} onClick={() => hold(t.value)}>
                  <b>{t.label}</b>
                  <small>{t.hint}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Gains</legend>
            {KNOBS.filter((k) => !k.advanced).map(knob)}
            <details>
              <summary>kI and kD</summary>
              {KNOBS.filter((k) => k.advanced).map(knob)}
            </details>
          </fieldset>
          <label className="lf-check">
            <input type="checkbox" checked={load} onChange={(e) => setLoad(e.target.checked)} />
            Add a load (extra drag on the wheel)
          </label>
        </div>

        <div className="lf-pg-visual">
          <svg viewBox="-60 -60 120 130" role="img" aria-label={`Flywheel spinning at ${(latest?.velocity ?? 0).toFixed(1)} rotations per second`}>
            <rect x="-5" y="0" width="10" height="62" className="support" />
            <circle r="46" className="rim" />
            <g transform={`rotate(${-angle})`} className="spokes">
              <line x1="-46" x2="46" />
              <line y1="-46" y2="46" />
              <circle cx="38" r="5" className="marker" />
            </g>
            <circle r="6" className="hub" />
          </svg>
          <div className={`lf-lamp${latest?.atTarget ? ' on' : ''}`}>
            <span aria-hidden="true" /> At Target: <b>{latest?.atTarget ? 'true' : 'false'}</b>
          </div>
        </div>
      </div>

      <Chart
        data={samples.current.slice() as never}
        series={flywheelSeries}
        band={flywheelBand}
        leftLabel="RPS"
        rightLabel="volts"
        windowSeconds={WINDOW_SECONDS}
        ariaLabel="Live graph of target, velocity, error and output voltage"
      />

      <div className="lf-pg-bar">
        <label>
          Preset{' '}
          <select value={presetId ?? ''} onChange={(e) => e.target.value && reset(flywheelPresets[e.target.value as FlywheelPresetId].gains)}>
            {!presetId && <option value="">Custom</option>}
            {(Object.keys(flywheelPresets) as FlywheelPresetId[]).map((id) => (
              <option key={id} value={id}>{flywheelPresets[id].label}</option>
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
