import { RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  CLEARANCE_HEIGHT, MAX_ELEVATOR, SAFE_ARM_MAX, SAFE_ARM_MIN, Superstructure, planFauxIntake, planRaw, planSafeMove, poses, type PoseId,
} from '../../sim/superstructure';
import Tasks from './Tasks';

const DT = 0.02;
// Side view: floor at y 232, 1.2 m of elevator travel drawn 150 px tall.
const PX = 125;
const FLOOR = 232;
const BASE_PIVOT = 1.1 - 0.5; // pivot height above floor at zero elevator extension (meters)
const pivotY = (h: number) => FLOOR - (BASE_PIVOT + h) * PX;

/** Move an arm on an elevator with and without the Lab 10 safety rule. */
export default function SafetySandbox({ lessonId }: { lessonId?: string }) {
  const [safe, setSafe] = useState(true);
  const [, setFrame] = useState(0);
  const sim = useRef(new Superstructure());
  const live = useRef(safe);
  live.current = safe;
  const risk = useRef(false);
  const seen = useRef({ faux: false, blocked: false, armFirst: false, collision: false });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let owed = 0;
    const tick = (now: number) => {
      owed = Math.min(owed + (now - last) / 1000, 0.1);
      last = now;
      while (owed >= DT) {
        sim.current.step(DT);
        if (sim.current.collisionRisk) seen.current.collision = true;
        risk.current = sim.current.collisionRisk;
        owed -= DT;
      }
      setFrame((f) => f + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function go(id: PoseId) {
    const s = sim.current;
    const plan = live.current ? planSafeMove(s.arm, poses[id]) : planRaw(poses[id]);
    if (plan.transition === 'ARM_FIRST') seen.current.armFirst = true;
    s.start(plan);
  }
  function faux() {
    const s = sim.current;
    const plan = planFauxIntake(s.height);
    if (plan.transition === 'BLOCKED') seen.current.blocked = true;
    else seen.current.faux = true;
    s.start(plan);
  }
  function reset() {
    sim.current = new Superstructure();
    risk.current = false;
  }

  const s = sim.current;
  const py = pivotY(s.height);
  const rad = (s.arm * Math.PI) / 180;
  const tipX = 110 + Math.cos(rad) * 70;
  const tipY = py - Math.sin(rad) * 70;
  const clearY = pivotY(CLEARANCE_HEIGHT);
  const envA = (deg: number) => ({ x: 110 + Math.cos((deg * Math.PI) / 180) * 78, y: py - Math.sin((deg * Math.PI) / 180) * 78 });
  const e1 = envA(SAFE_ARM_MIN);
  const e2 = envA(SAFE_ARM_MAX);

  return (
    <div className="lf-playground lf-safety not-content">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Go to L4, then run the faux intake', done: seen.current.faux },
          { label: 'Run the faux intake at L2 and get BLOCKED', done: seen.current.blocked },
          { label: 'After the faux intake, go to a level and see arm first', done: seen.current.armFirst },
          { label: 'Turn the safety rule off and cause a collision risk', done: seen.current.collision },
        ]}
      />
      <div className="lf-pg-top">
        <div className="lf-pg-controls">
          <fieldset>
            <legend>Go to</legend>
            <div className="lf-seg six">
              {(Object.keys(poses) as PoseId[]).map((id) => (
                <button key={id} type="button" onClick={() => go(id)}>
                  <b>{poses[id].label}</b>
                  <small>{poses[id].height} m, {poses[id].arm}°</small>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="lf-pg-bar">
            <button type="button" onClick={faux}>Faux intake (right trigger)</button>
            <label className="lf-check">
              <input type="checkbox" checked={safe} onChange={(e) => setSafe(e.target.checked)} />
              Safety rule on
            </label>
            <span className="spacer" />
            <button type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true" />Reset</button>
          </div>
          <dl className="lf-readout">
            <div><dt>Current Transition</dt><dd>{s.transition}</dd></div>
            <div><dt>Height</dt><dd>{s.height.toFixed(2)} m</dd></div>
            <div><dt>Arm</dt><dd>{s.arm.toFixed(0)}°</dd></div>
          </dl>
          <span className={`lf-lamp${risk.current ? '' : ' on'}`} role="status">
            <span aria-hidden="true" /> {risk.current ? <b>Collision risk: carriage moving with the arm out</b> : 'No collision risk'}
          </span>
        </div>

        <div className="lf-pg-visual">
          <svg viewBox="0 0 220 250" role="img" aria-label={`Elevator at ${s.height.toFixed(2)} meters, arm at ${s.arm.toFixed(0)} degrees`}>
            <rect x="0" y={FLOOR} width="220" height="18" className="floor" />
            <rect x="60" y={FLOOR - 0.18 * PX} width="100" height={0.18 * PX} rx="3" className="drive" />
            <line x1="110" x2="110" y1={FLOOR - 0.18 * PX} y2={pivotY(MAX_ELEVATOR)} className="rail" />
            <rect x="102" y={py - 8} width="16" height="16" rx="3" className="carriage" />
            <line x1="40" x2="190" y1={clearY} y2={clearY} className="clear" />
            <text x="192" y={clearY + 4} className="muted">0.64 m</text>
            <path d={`M 110 ${py} L ${e1.x} ${e1.y} A 78 78 0 0 1 ${e2.x} ${e2.y} Z`} className="envelope" />
            <line x1="110" y1={py} x2={tipX} y2={tipY} className={`link${risk.current ? ' risk' : ''}`} />
            <circle cx="110" cy={py} r="5" className="hub" />
          </svg>
        </div>
      </div>
    </div>
  );
}
