import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BASE_WORK_MS, callsPerSecond, LoopTimer, PERIOD_MS } from '../../sim/loopTimer';
import Tip from '../viz/Tip';
import Tasks from './Tasks';

const WINDOW_MS = 200;
const AHEAD_MS = 20;
const W = 640;
const H = 110;
const SPEEDS = [1, 0.2];
const px = (ms: number, now: number) => ((ms - (now - WINDOW_MS)) / (WINDOW_MS + AHEAD_MS)) * W;

/** Watch periodic() and execute() fire every 20 ms, then slow the code down until the loop overruns. */
export default function LoopTicker({ lessonId }: { lessonId?: string }) {
  const [delay, setDelay] = useState(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [, setFrame] = useState(0);

  const timer = useRef(new LoopTimer());
  const now = useRef(0);
  const live = useRef({ delay, running, speed });
  live.current = { delay, running, speed };
  const seen = useRef({ overrun: false, recovered: false, ontime: 0 });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(t - last, 100);
      last = t;
      const { delay, running, speed } = live.current;
      if (running) {
        now.current += dt * SPEEDS[speed];
        const fresh = timer.current.advanceTo(now.current, delay);
        for (const f of fresh) {
          if (f.overrun) { seen.current.overrun = true; seen.current.ontime = 0; }
          else if (seen.current.overrun && f.lateMs === 0 && ++seen.current.ontime >= 10) seen.current.recovered = true;
        }
      }
      setFrame((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function reset() {
    timer.current = new LoopTimer();
    now.current = 0;
    seen.current = { overrun: false, recovered: false, ontime: 0 };
    setDelay(0);
    setRunning(true);
  }

  const ticks = timer.current.ticks;
  const t = now.current;
  const visible = ticks.filter((k) => k.endMs > t - WINDOW_MS);
  const latest = ticks[ticks.length - 1];
  const rate = callsPerSecond(ticks, t);
  const overruns = ticks.filter((k) => k.overrun).length;
  const slow = latest?.overrun;
  const grid: number[] = [];
  for (let g = Math.ceil((t - WINDOW_MS) / PERIOD_MS) * PERIOD_MS; g <= t + AHEAD_MS; g += PERIOD_MS) grid.push(g);

  return (
    <div className="lf-playground lf-ticker">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Slow the code until the loop overruns', done: seen.current.overrun },
          { label: 'Speed it up again and get back to on-time ticks', done: seen.current.recovered },
        ]}
      />

      <label className="lf-knob">
        <span className="name"><b>Slow code</b> added to each tick</span>
        <input type="range" min={0} max={50} step={1} value={delay} onChange={(e) => setDelay(+e.target.value)} />
        <output>+{delay} ms</output>
      </label>

      <svg viewBox={`0 0 ${W} ${H}`} className="lf-ticker-map" role="img" aria-label="Timeline of the last 200 milliseconds of robot loop ticks">
        {grid.map((g) => (
          <line key={g} x1={px(g, t)} x2={px(g, t)} y1={6} y2={H - 24} className="grid" />
        ))}
        <text x={4} y={H - 6} className="muted">Each line is a 20 ms slot</text>
        {visible.map((k) => (
          <g key={k.n}>
            <rect x={px(k.startMs, t)} y={20} width={Math.max(((Math.min(k.endMs, t) - k.startMs) / (WINDOW_MS + AHEAD_MS)) * W, 1.5)} height={44} rx={3} className={`work${k.overrun ? ' over' : ''}`} />
          </g>
        ))}
        <line x1={px(t, t)} x2={px(t, t)} y1={4} y2={H - 24} className="now" />
      </svg>

      <div className="lf-ticker-read" aria-live="off">
        <span className={`call${latest && t - latest.startMs < 80 ? ' hot' : ''}`}>periodic()</span>
        <span className={`call${latest && t - latest.startMs < 80 ? ' hot' : ''}`}>execute()</span>
        <span>Loops per second <b className={slow ? 'bad' : ''}>{rate.toFixed(0)}</b></span>
        <span>Loop time <b className={BASE_WORK_MS + delay > PERIOD_MS ? 'bad' : ''}>{BASE_WORK_MS + delay} ms</b></span>
        <span>Overruns <b className={overruns ? 'bad' : ''}>{overruns}</b></span>
      </div>

      <div className="lf-pg-bar">
        <button type="button" aria-pressed={running} onClick={() => setRunning(!running)}>
          {running ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
          {running ? 'Pause' : 'Play'}
        </button>
        <div className="lf-seg two" role="group" aria-label="Speed">
          <button type="button" aria-pressed={speed === 0} onClick={() => setSpeed(0)}>Real time</button>
          <button type="button" aria-pressed={speed === 1} onClick={() => setSpeed(1)}>Slow motion</button>
        </div>
        <Tip label="About the loop">
          Each tick runs your code, and a tick cannot start until the previous one has finished. If the code takes more than 20 ms, WPILib reports a loop overrun.
        </Tip>
        <span className="spacer" />
        <button type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true" />Reset</button>
      </div>
    </div>
  );
}
