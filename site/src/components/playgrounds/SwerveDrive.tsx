import { RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { moduleNames, modulePositions, type ChassisSpeeds } from '../../sim/swerve/kinematics';
import { FIELD_SIZE_METERS, LOOP_PERIOD, SwerveSim } from '../../sim/swerve/swerveSim';
import Tasks from './Tasks';

const PX = 50; // pixels per meter on the field drawing
const PRESETS: Array<{ label: string; c: ChassisSpeeds }> = [
  { label: 'Forward', c: { vx: 2, vy: 0, omega: 0 } },
  { label: 'Strafe left', c: { vx: 0, vy: 2, omega: 0 } },
  { label: 'Spin', c: { vx: 0, vy: 0, omega: 1 } },
  { label: 'Forward + spin', c: { vx: 2, vy: 0, omega: 1 } },
  { label: 'Stop', c: { vx: 0, vy: 0, omega: 0 } },
];
const knobs: Array<{ key: keyof ChassisSpeeds; name: string; unit: string; max: number; step: number }> = [
  { key: 'vx', name: 'vx (forward)', unit: 'm/s', max: 4, step: 0.1 },
  { key: 'vy', name: 'vy (left)', unit: 'm/s', max: 4, step: 0.1 },
  { key: 'omega', name: 'omega (counter-clockwise)', unit: 'rad/s', max: 3, step: 0.1 },
];

/** Ask for a ChassisSpeeds and watch the four wheel speeds and angles that come out. */
export default function SwerveDrive({ lessonId }: { lessonId?: string }) {
  const [c, setC] = useState<ChassisSpeeds>({ vx: 0, vy: 0, omega: 0 });
  const [, setFrame] = useState(0);
  const sim = useRef(new SwerveSim());
  const live = useRef(c);
  live.current = c;
  const seen = useRef({ strafe: false, spin: false, both: false, flip: false });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let owed = 0;
    const tick = (now: number) => {
      owed = Math.min(owed + (now - last) / 1000, 0.1);
      last = now;
      while (owed >= LOOP_PERIOD) {
        sim.current.step(live.current);
        owed -= LOOP_PERIOD;
      }
      const { vx, vy, omega } = live.current;
      const mem = seen.current;
      if (Math.abs(vx) < 0.05 && vy > 1 && Math.abs(omega) < 0.05) mem.strafe = true;
      if (Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05 && Math.abs(omega) > 0.8) mem.spin = true;
      if (vx > 1 && Math.abs(omega) > 0.5) mem.both = true;
      if (moduleNames.some((n) => sim.current.states[n].speed < -0.05)) mem.flip = true;
      setFrame((f) => f + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { pose, states, requested } = sim.current;
  const fieldPoint = (x: number, y: number) => `translate(${x * PX} ${(FIELD_SIZE_METERS - y) * PX})`;

  return (
    <div className="lf-playground lf-swerve not-content">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Strafe left with vx at 0', done: seen.current.strafe },
          { label: 'Spin in place and compare the four wheel angles', done: seen.current.spin },
          { label: 'Drive forward while spinning', done: seen.current.both },
          { label: 'Make a wheel switch to running backward (shorter turn column)', done: seen.current.flip },
        ]}
      />
      <div className="lf-pg-top">
        <div className="lf-pg-controls">
          <fieldset>
            <legend>Request</legend>
            <div className="lf-seg five">
              {PRESETS.map((p) => (
                <button key={p.label} type="button" aria-pressed={p.c.vx === c.vx && p.c.vy === c.vy && p.c.omega === c.omega} onClick={() => setC(p.c)}>{p.label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>ChassisSpeeds</legend>
            {knobs.map((k) => (
              <label key={k.key} className="lf-knob">
                <span className="name"><b>{k.name}</b> <span className="unit">{k.unit}</span></span>
                <input type="range" min={-k.max} max={k.max} step={k.step} value={c[k.key]} aria-label={k.name} onChange={(e) => setC({ ...c, [k.key]: +e.target.value })} />
                <output>{c[k.key].toFixed(1)}</output>
              </label>
            ))}
          </fieldset>
          <table className="lf-wheels">
            <thead><tr><th>Wheel</th><th>Speed</th><th>Angle</th><th>Shorter turn</th></tr></thead>
            <tbody>
              {moduleNames.map((n) => (
                <tr key={n}>
                  <th scope="row">{n}</th>
                  <td>{requested[n].speed.toFixed(2)} m/s</td>
                  <td>{requested[n].angle.toFixed(1)}°</td>
                  <td>{states[n].speed !== 0 && Math.abs(states[n].speed - requested[n].speed) > 1e-6 ? `${states[n].speed.toFixed(2)} m/s at ${states[n].angle.toFixed(1)}°` : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lf-pg-visual">
          <svg viewBox={`0 0 ${FIELD_SIZE_METERS * PX} ${FIELD_SIZE_METERS * PX}`} role="img" aria-label={`Top view: robot at ${pose.x.toFixed(1)}, ${pose.y.toFixed(1)} meters, heading ${pose.heading.toFixed(0)} degrees`}>
            <rect width={FIELD_SIZE_METERS * PX} height={FIELD_SIZE_METERS * PX} className="floor" />
            <g transform={`${fieldPoint(pose.x, pose.y)} rotate(${-pose.heading})`}>
              <rect x={-0.4 * PX} y={-0.4 * PX} width={0.8 * PX} height={0.8 * PX} rx="4" className="body" />
              <path d={`M ${0.4 * PX} 0 l -10 -7 v 14 z`} className="front" />
              {moduleNames.map((n) => {
                const p = modulePositions[n];
                const s = states[n];
                return (
                  <g key={n} transform={`translate(${p.x * 1.4 * PX} ${-p.y * 1.4 * PX}) rotate(${-s.angle})`}>
                    <rect x="-8" y="-3.5" width="16" height="7" rx="2" className="wheel" />
                    <line x1="0" y1="0" x2={s.speed * 11} y2="0" className="arrow" />
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="lf-pg-bar"><span className="spacer" /><button type="button" onClick={() => { sim.current = new SwerveSim(); setC({ vx: 0, vy: 0, omega: 0 }); }}><RotateCcw size={15} aria-hidden="true" />Reset</button></div>
        </div>
      </div>
    </div>
  );
}
