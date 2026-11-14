import { CircleCheck, RotateCcw, Send, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { duplicateIds, MAX_CAN_ID, send, validId, type CanDevice, type SendResult } from '../../sim/can/bus';
import Tasks from './Tasks';

const START: CanDevice[] = [{ name: 'Intake', id: 4 }, { name: 'Shooter', id: 5 }, { name: 'Elevator', id: 6 }];
const MOTOR_X = [250, 400, 550];
const BUS_Y = 46;
const TRAVEL_MS = 700;

/** Three TalonFXs on one CAN bus. Change the IDs on the devices and in the code, then send a command. */
export default function CanBusSim({ lessonId }: { lessonId?: string }) {
  const [motors, setMotors] = useState<CanDevice[]>(START);
  const [codeId, setCodeId] = useState(4);
  const [sent, setSent] = useState<{ id: number; result: SendResult } | null>(null);
  const [flying, setFlying] = useState(false);
  const seen = useRef({ shooter: false, none: false, conflict: false });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const duplicates = duplicateIds(motors);
  const ok = validId(codeId) && motors.every((m) => validId(m.id));

  function clear() {
    clearTimeout(timer.current);
    setFlying(false);
    setSent(null);
  }
  function run() {
    const result = send(motors, codeId);
    setSent(null);
    setFlying(true);
    clearTimeout(timer.current);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer.current = setTimeout(() => {
      setFlying(false);
      setSent({ id: codeId, result });
      if (result.kind === 'ok' && result.index === 1) seen.current.shooter = true;
      if (result.kind === 'none') seen.current.none = true;
      if (result.kind === 'conflict') seen.current.conflict = true;
    }, still ? 0 : TRAVEL_MS);
  }

  const result = sent?.result;
  const spinning = (i: number) => result?.kind === 'ok' && result.index === i;
  const clashing = (i: number) => result?.kind === 'conflict' && result.indexes.includes(i);

  return (
    <div className="lf-playground lf-can">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Spin the shooter motor', done: seen.current.shooter },
          { label: 'Send a command to an ID that no motor has', done: seen.current.none },
          { label: 'Give two motors the same ID, then send to it', done: seen.current.conflict },
        ]}
      />

      <svg viewBox="0 0 640 170" role="img" aria-label={`CAN bus: a roboRIO and three TalonFX motors with IDs ${motors.map((m) => m.id).join(', ')}`}>
        <rect className="node" x="20" y="20" width="120" height="52" rx="6" />
        <text x="80" y="42" textAnchor="middle">roboRIO</text>
        <text className="muted" x="80" y="59" textAnchor="middle">sends to ID {validId(codeId) ? codeId : '?'}</text>
        <path className="bus" d={`M140 ${BUS_Y}H610`} />
        <text className="muted" x="610" y={BUS_Y - 10} textAnchor="end">CAN bus</text>
        {flying && <circle className="frame" cy={BUS_Y} r="7" style={{ animationDuration: `${TRAVEL_MS}ms` }} />}
        {motors.map((m, i) => (
          <g key={m.name} className={`motor${spinning(i) ? ' spin' : ''}${clashing(i) ? ' clash' : ''}`}>
            <path className="bus" d={`M${MOTOR_X[i]} ${BUS_Y}V84`} />
            <circle className="body" cx={MOTOR_X[i]} cy="112" r="28" />
            <g className="rotor" style={{ transformOrigin: `${MOTOR_X[i]}px 112px` }}>
              <path d={`M${MOTOR_X[i] - 18} 112h36M${MOTOR_X[i]} 94v36`} />
            </g>
            <text x={MOTOR_X[i]} y="160" textAnchor="middle">{m.name}</text>
          </g>
        ))}
      </svg>

      <div className="ids">
        {motors.map((m, i) => (
          <label key={m.name}>
            {m.name} ID
            <input
              type="number" min={0} max={MAX_CAN_ID} value={Number.isNaN(m.id) ? '' : m.id}
              aria-invalid={!validId(m.id) || duplicates.includes(m.id)}
              onChange={(e) => { clear(); setMotors(motors.map((x, j) => (j === i ? { ...x, id: e.target.valueAsNumber } : x))); }}
            />
          </label>
        ))}
      </div>

      <div className="code">
        <pre><code>
          {'TalonFX motor = new TalonFX('}
          <input
            type="number" min={0} max={MAX_CAN_ID} value={Number.isNaN(codeId) ? '' : codeId} aria-label="CAN ID in code"
            aria-invalid={!validId(codeId)}
            onChange={(e) => { clear(); setCodeId(e.target.valueAsNumber); }}
          />
          {');\nmotor.setVoltage(6.0);'}
        </code></pre>
        <button type="button" className="primary" disabled={!ok || flying} onClick={run}><Send size={15} aria-hidden="true" />Send</button>
        <button type="button" onClick={() => { clear(); setMotors(START); setCodeId(4); }}><RotateCcw size={15} aria-hidden="true" />Reset</button>
      </div>

      <div role="status">
        {!ok ? (
          <p className="lf-feedback no">CAN IDs are whole numbers from 0 to {MAX_CAN_ID}.</p>
        ) : result?.kind === 'ok' ? (
          <p className="lf-feedback ok"><CircleCheck size={16} aria-hidden="true" /> The {motors[result.index].name.toLowerCase()} motor has ID {sent!.id}, so it takes the command and spins. The others ignore it.</p>
        ) : result?.kind === 'none' ? (
          <p className="lf-feedback no"><TriangleAlert size={16} aria-hidden="true" /> No device has ID {sent!.id}, so nothing answers and nothing moves. The code does not crash: no exception is thrown. The only clue is an error in the Driver Station.</p>
        ) : result?.kind === 'conflict' ? (
          <p className="lf-feedback no"><TriangleAlert size={16} aria-hidden="true" /> The {result.indexes.map((i) => motors[i].name.toLowerCase()).join(' and ')} motors both claim ID {sent!.id}. Their messages collide, so neither can be trusted. Give every device its own ID.</p>
        ) : duplicates.length > 0 ? (
          <p className="lf-feedback info">Two motors now share ID {duplicates[0]}.</p>
        ) : null}
      </div>
    </div>
  );
}
