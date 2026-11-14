import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  bindings, commandOrder, commands, CommandScheduler,
  type ButtonId, type Mark, type SubsystemId, type TickRecord,
} from '../../sim/commands/scheduler';
import Tip from '../viz/Tip';
import Tasks from './Tasks';

const COLUMNS = 24;
const SPEEDS = [2, 5, 10];
const subsystemNames: Record<SubsystemId, string> = { flywheel: 'Flywheel', elevator: 'Elevator' };
const markText: Record<Exclude<Mark, null>, string> = {
  init: 'initialize and execute', run: 'execute', interrupted: 'end(true): interrupted', finished: 'end(false): finished',
};
const buttonCommand = Object.fromEntries(bindings.map((b) => [b.button, b])) as Record<ButtonId, (typeof bindings)[number]>;

/** Hold virtual buttons and watch the scheduler start, interrupt and finish commands, one 20 ms loop at a time. */
export default function SchedulerVisualizer({ lessonId }: { lessonId?: string }) {
  const [buttons, setButtons] = useState<Record<ButtonId, boolean>>({ A: false, B: false, X: false, Y: false });
  const [forget, setForget] = useState(false);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [, setFrame] = useState(0);

  const sim = useRef(new CommandScheduler());
  const history = useRef<TickRecord[]>([]);
  const seen = useRef({ interruptDefault: false, handoff: false, together: false, finished: false, collision: false });
  const live = useRef({ buttons, forget });
  live.current = { buttons, forget };

  function step() {
    const { buttons, forget } = live.current;
    const t = sim.current.step({ buttons, forwardForgetsRequirement: forget });
    history.current = [...history.current, t].slice(-COLUMNS);
    const mem = seen.current;
    if (t.marks.hold === 'interrupted' && t.owners.flywheel === 'forward') mem.interruptDefault = true;
    if (t.marks.forward === 'interrupted' && t.owners.flywheel === 'reverse') mem.handoff = true;
    if (t.owners.flywheel === 'forward' && t.owners.elevator === 'elevator') mem.together = true;
    if (t.marks.spin === 'finished') mem.finished = true;
    if (t.flywheelWriters > 1) mem.collision = true;
    setFrame((f) => f + 1);
  }
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => stepRef.current(), 1000 / SPEEDS[speed]);
    return () => clearInterval(id);
  }, [running, speed]);

  function reset() {
    sim.current = new CommandScheduler();
    history.current = [];
    setButtons({ A: false, B: false, X: false, Y: false });
    setForget(false);
    setRunning(true);
  }

  const rows = history.current;
  const last = rows[rows.length - 1];
  const cells = Array.from({ length: COLUMNS }, (_, i) => rows[rows.length - COLUMNS + i] as TickRecord | undefined);
  const collision = !!last && last.flywheelWriters > 1;

  return (
    <div className="lf-playground lf-sched">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Hold A and watch the default command get interrupted', done: seen.current.interruptDefault },
          { label: 'Hold A, then also press B', done: seen.current.handoff },
          { label: 'Hold A and X together and see both run', done: seen.current.together },
          { label: 'Tap Y and let the command finish by itself', done: seen.current.finished },
          { label: 'Make two commands drive the flywheel at once', done: seen.current.collision },
        ]}
      />

      <div className="lf-pad">
        <div className="buttons" role="group" aria-label="Virtual controller">
          {(['A', 'B', 'X', 'Y'] as ButtonId[]).map((b) => (
            <button key={b} type="button" className={`pad-${b}`} aria-pressed={buttons[b]} onClick={() => setButtons({ ...buttons, [b]: !buttons[b] })}>
              <b>{b}</b>
              <small>{commands[buttonCommand[b].command].name}</small>
              <small className="mode">{buttonCommand[b].mode}</small>
            </button>
          ))}
        </div>
        <label className="lf-check">
          <input type="checkbox" checked={forget} onChange={(e) => setForget(e.target.checked)} />
          “Spin forward” forgets <code>addRequirements</code>
        </label>
        <Tip label="How the pad works">
          Click a button to hold it, and click again to release. <code>whileTrue</code> cancels the command on release; <code>onTrue</code> lets it run on.
        </Tip>
      </div>

      <div className="lf-timeline" role="table" aria-label="Command timeline, newest loop on the right">
        {commandOrder.map((id) => (
          <div className="row" role="row" key={id}>
            <span className="name" role="rowheader">{commands[id].name}</span>
            <span className="cells">
              {cells.map((c, i) => {
                const m = c?.marks[id] ?? null;
                return <i key={i} role="cell" className={m ?? ''} aria-label={m ? `Loop ${c!.tick}: ${markText[m]}` : undefined} title={m ? `Loop ${c!.tick}: ${markText[m]}` : undefined} />;
              })}
            </span>
          </div>
        ))}
        <div className="row axis" aria-hidden="true">
          <span className="name">Loop</span>
          <span className="cells">
            {cells.map((c, i) => <i key={i}>{c && c.tick % 5 === 0 ? c.tick : ''}</i>)}
          </span>
        </div>
      </div>
      <div className="lf-legend" aria-hidden="true">
        <span><i className="init" /> initialize</span>
        <span><i className="run" /> execute</span>
        <span><i className="finished" /> end(false)</span>
        <span><i className="interrupted" /> end(true)</span>
      </div>

      <div className="lf-sched-state">
        {(Object.keys(subsystemNames) as SubsystemId[]).map((s) => (
          <div key={s} className="owner">
            <span>{subsystemNames[s]} is run by</span>
            <b>{last?.owners[s] ? commands[last.owners[s]!].name : 'nobody'}</b>
          </div>
        ))}
        <div className="owner">
          <span>Flywheel voltage</span>
          <b>{last ? `${last.volts} V` : '0 V'}</b>
        </div>
        <span className={`lf-lamp${collision ? '' : ' on'}`} role="status">
          <span aria-hidden="true" /> {collision ? <b>{last!.flywheelWriters} commands are writing the flywheel</b> : 'One writer at a time'}
        </span>
      </div>

      <p className="lf-calls" aria-live="off">
        <span>Last loop{last ? ` (${last.tick})` : ''}</span>
        {last ? (last.calls.length ? last.calls.map((c, i) => <code key={i}>{c}</code>) : <em>no start or stop calls</em>) : <em>not started</em>}
      </p>

      <div className="lf-pg-bar">
        <button type="button" className="primary" onClick={() => setRunning(!running)}>
          {running ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}{running ? 'Pause' : 'Run'}
        </button>
        <button type="button" onClick={step} disabled={running}><StepForward size={15} aria-hidden="true" />Step one loop</button>
        <div className="lf-seg three" role="group" aria-label="Speed">
          {SPEEDS.map((s, i) => (
            <button key={s} type="button" aria-pressed={speed === i} onClick={() => setSpeed(i)}>{s} loops/s</button>
          ))}
        </div>
        <span className="spacer" />
        <button type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true" />Reset</button>
      </div>
    </div>
  );
}
