import { RotateCcw } from 'lucide-react';
import { useRef, useState } from 'react';
import { gearResult } from '../../sim/gearing';
import Tip from '../viz/Tip';
import Tasks from './Tasks';

const PITCH = 3.2; // px of pitch radius per tooth
const DRIVER_SECONDS = 2; // slowed-down seconds per driver turn

/** Gear outline: a circle of teeth drawn as a closed path around the pitch radius. */
function gearPath(teeth: number): string {
  const r = teeth * PITCH;
  const depth = 5;
  const pts: string[] = [];
  const n = teeth * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rad = i % 4 === 1 || i % 4 === 2 ? r + depth / 2 : r - depth / 2;
    pts.push(`${(rad * Math.cos(a)).toFixed(1)},${(rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Pick tooth counts for a gear pair and see what the trade does to output speed and torque. */
export default function GearingPlayground({ lessonId }: { lessonId?: string }) {
  const [driver, setDriver] = useState(12);
  const [driven, setDriven] = useState(36);
  const seen = useRef({ reduction: false, strong: false, overdrive: false });
  const r = gearResult({ driverTeeth: driver, drivenTeeth: driven });
  if (r.kind === 'reduction') seen.current.reduction = true;
  if (r.torqueNm >= 50) seen.current.strong = true;
  if (r.kind === 'overdrive') seen.current.overdrive = true;

  const r1 = driver * PITCH;
  const r2 = driven * PITCH;
  const cx1 = r1 + 8;
  const cx2 = cx1 + r1 + r2;
  const H = Math.max(r1, r2) * 2 + 16;
  const W = cx2 + r2 + 8;
  const cy = H / 2;
  // Align a tooth of each gear on the line between centres so they look meshed.
  const offset = (180 / driven) * (driven % 2 === 0 ? 1 : 0);

  return (
    <div className="lf-playground lf-gearing">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Make a reduction', done: seen.current.reduction },
          { label: 'Get more than 50 N·m at the output', done: seen.current.strong },
          { label: 'Make an overdrive (speeds up, loses torque)', done: seen.current.overdrive },
        ]}
      />

      <div className="controls">
        <label className="lf-knob">
          <span className="name"><b>Motor gear</b> teeth</span>
          <input type="range" min={8} max={30} step={1} value={driver} onChange={(e) => setDriver(+e.target.value)} />
          <output>{driver}</output>
        </label>
        <label className="lf-knob">
          <span className="name"><b>Mechanism gear</b> teeth</span>
          <input type="range" min={8} max={72} step={1} value={driven} onChange={(e) => setDriven(+e.target.value)} />
          <output>{driven}</output>
        </label>
      </div>

      <svg className="lf-gears" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Motor gear with ${driver} teeth driving a mechanism gear with ${driven} teeth`}>
        <g transform={`translate(${cx1} ${cy})`}>
          <g className="gear spin" style={{ animationDuration: `${DRIVER_SECONDS}s`, fill: 'var(--sig-output)' }}>
            <path d={gearPath(driver)} />
            <rect x={-2} y={-r1 + 10} width={4} height={r1 * 0.5} className="mark" />
          </g>
          <text y={4} textAnchor="middle" className="hub">Motor</text>
        </g>
        <g transform={`translate(${cx2} ${cy}) rotate(${offset})`}>
          <g className="gear spin reverse" style={{ animationDuration: `${DRIVER_SECONDS * r.ratio}s`, fill: 'var(--sig-measurement)' }}>
            <path d={gearPath(driven)} />
            <rect x={-2} y={-r2 + 10} width={4} height={r2 * 0.25} className="mark" />
          </g>
          <text y={4} textAnchor="middle" className="hub" transform={`rotate(${-offset})`}>Mechanism</text>
        </g>
      </svg>

      <dl className="lf-gear-read">
        <div><dt>Ratio</dt><dd>{r.ratio.toFixed(2)}:1</dd></div>
        <div><dt>Output speed</dt><dd>{r.speedRPS.toFixed(1)} RPS</dd></div>
        <div><dt>Output torque</dt><dd>{r.torqueNm.toFixed(1)} N·m</dd></div>
      </dl>

      <div className="lf-pg-bar">
        <Tip label="About these numbers">
          One Kraken X60: 100 RPS free speed and 7.09 N·m stall torque at 12 V. Speed shown is with no load, torque is at stall, before losses. Animation is slowed down.
        </Tip>
        <span className="spacer" />
        <button type="button" onClick={() => { setDriver(12); setDriven(36); }}><RotateCcw size={15} aria-hidden="true" />Reset</button>
      </div>
    </div>
  );
}
