import { ArrowLeftRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { convert, mechanismUnit, type Direction, type Mechanism } from '../../sim/unitConvert';
import Tasks from './Tasks';

const fmt = (v: number) => (Number.isFinite(v) ? String(Math.round(v * 1e4) / 1e4) : '–');

/** Turn motor rotations into mechanism degrees or meters through the gear ratio, and back. */
export default function UnitConverter({ lessonId }: { lessonId?: string }) {
  const [mechanism, setMechanism] = useState<Mechanism>('elevator');
  const [direction, setDirection] = useState<Direction>('toMechanism');
  const [value, setValue] = useState(25);
  const [gearRatio, setGearRatio] = useState(10);
  const [radius, setRadius] = useState(0.022);
  const seen = useRef({ arm: false, elevator: false, back: false });

  const valid = gearRatio > 0 && (mechanism === 'arm' || radius > 0) && Number.isFinite(value);
  const out = valid ? convert({ mechanism, direction, value, gearRatio, radiusMeters: radius }) : null;
  if (out) {
    if (direction === 'toMotor') seen.current.back = true;
    else seen.current[mechanism] = true;
  }
  const inUnit = direction === 'toMechanism' ? 'motor rotations' : mechanismUnit(mechanism);

  return (
    <div className="lf-playground lf-unitconv">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Convert motor rotations to arm degrees', done: seen.current.arm },
          { label: 'Convert motor rotations to elevator meters', done: seen.current.elevator },
          { label: 'Go backwards, from the mechanism to motor rotations', done: seen.current.back },
        ]}
      />

      <div className="lf-pg-bar head">
        <div className="lf-seg two" role="group" aria-label="Mechanism">
          <button type="button" aria-pressed={mechanism === 'arm'} onClick={() => setMechanism('arm')}>Arm</button>
          <button type="button" aria-pressed={mechanism === 'elevator'} onClick={() => setMechanism('elevator')}>Elevator</button>
        </div>
        <button type="button" onClick={() => setDirection(direction === 'toMechanism' ? 'toMotor' : 'toMechanism')}>
          <ArrowLeftRight size={15} aria-hidden="true" />
          {direction === 'toMechanism' ? 'Motor to mechanism' : 'Mechanism to motor'}
        </button>
      </div>

      <div className="lf-knob-grid">
        <label className="lf-knob">
          <span className="name"><b>{inUnit}</b></span>
          <input type="number" value={value} step="any" onChange={(e) => setValue(e.target.valueAsNumber)} />
        </label>
        <label className="lf-knob">
          <span className="name"><b>Gear ratio</b></span>
          <input type="number" min={0} value={gearRatio} step="any" onChange={(e) => setGearRatio(e.target.valueAsNumber)} />
        </label>
        {mechanism === 'elevator' && (
          <label className="lf-knob">
            <span className="name"><b>Drum radius</b></span>
            <input type="number" min={0} value={radius} step="any" onChange={(e) => setRadius(e.target.valueAsNumber)} />
            <span className="unit">m</span>
          </label>
        )}
      </div>

      {out ? (
        <ol className="lf-conv-chain" aria-live="polite">
          {out.steps.map((s, i) => (
            <li key={s.label} className={i === out.steps.length - 1 ? 'last' : ''}>
              <span>{s.label}</span>
              <b>{fmt(s.value)}</b> <small>{s.unit}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="lf-feedback">Enter a positive gear ratio{mechanism === 'elevator' ? ' and radius' : ''}.</p>
      )}
    </div>
  );
}
