import { ChevronDown, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ElevatorSim, STOW_HEIGHT_METERS, type ElevatorSample } from '../../sim/elevatorSim';
import { elevatorPresets } from '../../sim/elevatorPresets';
import { FlywheelSim, LOOP_PERIOD, type FlywheelGains, type FlywheelSample } from '../../sim/flywheelSim';
import { flywheelPresets } from '../../sim/flywheelPresets';
import { buildTopics, buildTree, formatValue, splitTopic, writeTopic, type NtNode } from '../../sim/ntTree';
import Tip from '../viz/Tip';
import Tasks from './Tasks';

const FLY_TARGETS = [
  { label: 'Released', value: null },
  { label: '20 RPS', value: 20 },
  { label: '40 RPS', value: 40 },
  { label: '70 RPS', value: 70 },
] as const;
const ELEV_TARGETS = [
  { label: 'Stowed', value: STOW_HEIGHT_METERS },
  { label: '0.42 m', value: 0.42 },
  { label: '1.05 m', value: 1.05 },
] as const;

const START_GAINS = flywheelPresets.tuned.gains;

/** A live topic tree for the flywheel and elevator. Edit a Tuning topic and the flywheel follows. */
export default function NtExplorer({ lessonId }: { lessonId?: string }) {
  const [gains, setGains] = useState<FlywheelGains>(START_GAINS);
  const [flyTarget, setFlyTarget] = useState<number | null>(null);
  const [elevTarget, setElevTarget] = useState<number>(STOW_HEIGHT_METERS);
  const [paused, setPaused] = useState(false);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [, setFrame] = useState(0);

  const fly = useRef(new FlywheelSim(START_GAINS));
  const elev = useRef(new ElevatorSim(elevatorPresets.lab.gains));
  const last = useRef<{ fly?: FlywheelSample; elev?: ElevatorSample }>({});
  const live = useRef({ flyTarget, elevTarget, paused });
  live.current = { flyTarget, elevTarget, paused };
  const seen = useRef({ spun: false, tuned: false, picked: false });

  useEffect(() => fly.current.setGains(gains), [gains]);

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    let owed = 0;
    const tick = (now: number) => {
      owed = Math.min(owed + (now - prev) / 1000, 0.1);
      prev = now;
      if (!live.current.paused) {
        while (owed >= LOOP_PERIOD) {
          last.current = { fly: fly.current.step(live.current.flyTarget), elev: elev.current.step(live.current.elevTarget) };
          owed -= LOOP_PERIOD;
        }
        setFrame((f) => f + 1);
      } else owed = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function edit(path: string, value: number) {
    const next = writeTopic(path, value, gains);
    if (!next) return;
    setGains(next);
    if (next.kV !== START_GAINS.kV || next.kP !== START_GAINS.kP || next.kS !== START_GAINS.kS) seen.current.tuned = true;
  }

  function reset() {
    fly.current = new FlywheelSim(START_GAINS);
    elev.current = new ElevatorSim(elevatorPresets.lab.gains);
    last.current = {};
    setGains(START_GAINS);
    setFlyTarget(null);
    setElevTarget(STOW_HEIGHT_METERS);
  }

  const topics = buildTopics(last.current.fly, gains, last.current.elev);
  const tree = buildTree(topics);
  if ((last.current.fly?.velocity ?? 0) > 20) seen.current.spun = true;
  const picked = selected ? splitTopic(selected) : null;

  const row = (n: NtNode, depth: number): React.ReactNode => {
    if (n.topic) {
      const t = n.topic;
      return (
        <li key={n.path} className="lf-nt-row" style={{ paddingInlineStart: `${depth * 1.1}rem` }}>
          <button type="button" className="name" aria-pressed={selected === n.path} onClick={() => { setSelected(n.path); seen.current.picked = true; }}>
            {n.name}
          </button>
          <span className="type">{t.type}</span>
          {t.tunable ? (
            <input
              type="number" min={0} step={0.01} value={t.value as number}
              aria-label={`${n.name} value`}
              onChange={(e) => edit(t.path, +e.target.value)}
            />
          ) : (
            <output className={t.type === 'boolean' ? (t.value ? 'on' : '') : ''}>{formatValue(t)}</output>
          )}
        </li>
      );
    }
    const open = !closed[n.path];
    return (
      <li key={n.path}>
        <button
          type="button" className="lf-nt-folder" style={{ paddingInlineStart: `${depth * 1.1}rem` }}
          aria-expanded={open} onClick={() => setClosed({ ...closed, [n.path]: open })}
        >
          {open ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}
          {n.name}
        </button>
        {open && <ul>{n.children.map((c) => row(c, depth + 1))}</ul>}
      </li>
    );
  };

  return (
    <div className="lf-playground lf-nt not-content">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Hold the flywheel at 70 RPS and watch Velocity RPS climb', done: seen.current.spun },
          { label: 'Change a Tuning topic and watch Error RPS', done: seen.current.tuned },
          { label: 'Select a topic to see its table and topic name', done: seen.current.picked },
        ]}
      />
      <div className="lf-pg-controls lf-nt-drive">
        <fieldset>
          <legend>Flywheel button</legend>
          <div className="lf-seg four">
            {FLY_TARGETS.map((t) => (
              <button key={t.label} type="button" aria-pressed={flyTarget === t.value} onClick={() => setFlyTarget(t.value)}>{t.label}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Elevator button</legend>
          <div className="lf-seg four">
            {ELEV_TARGETS.map((t) => (
              <button key={t.label} type="button" aria-pressed={elevTarget === t.value} onClick={() => setElevTarget(t.value)}>{t.label}</button>
            ))}
          </div>
        </fieldset>
      </div>

      <ul className="lf-nt-tree" role="tree" aria-label="NetworkTables topics">{tree.children.map((c) => row(c, 0))}</ul>

      <div className="lf-nt-pick" aria-live="polite">
        {picked ? (
          <>
            <span>Table <code>{picked.table}</code></span>
            <span>Topic name <code>{picked.name}</code></span>
          </>
        ) : (
          <Tip label="About the tree">Values in the Tuning folder are subscribed to by the robot code, so editing one changes the flywheel. The rest are published.</Tip>
        )}
      </div>

      <div className="lf-pg-bar">
        <span className="spacer" />
        <button type="button" onClick={() => setPaused(!paused)}>{paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}{paused ? 'Resume' : 'Pause'}</button>
        <button type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true" />Reset</button>
      </div>
    </div>
  );
}
