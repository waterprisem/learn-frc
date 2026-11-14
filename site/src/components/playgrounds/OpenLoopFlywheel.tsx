import { RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LOOP_PERIOD, OpenLoopFlywheel as Sim, steadyRPS, type OpenLoopSample } from '../../sim/openLoop';
import Chart, { type ChartSeries } from '../viz/Chart';
import Tasks from './Tasks';

const WINDOW_SECONDS = 8;
const series: ChartSeries[] = [
  { key: 'expected', label: 'Expected RPS', unit: 'RPS', cssVar: '--sig-setpoint', dash: '7 5' },
  { key: 'velocity', label: 'Velocity RPS', unit: 'RPS', cssVar: '--sig-measurement', width: 3 },
  { key: 'commanded', label: 'Commanded voltage', unit: 'V', cssVar: '--sig-output', dash: '2 3', axis: 'right' },
];

/** Send a fixed voltage to a flywheel and watch battery sag and load move the speed while the code stays the same. */
export default function OpenLoopFlywheel({ lessonId }: { lessonId?: string }) {
  const [volts, setVolts] = useState(6);
  const [sag, setSag] = useState(false);
  const [load, setLoad] = useState(false);
  const [, setFrame] = useState(0);

  const sim = useRef(new Sim());
  const samples = useRef<OpenLoopSample[]>([]);
  const live = useRef({ volts, sag, load });
  live.current = { volts, sag, load };
  const seen = useRef({ sag: false, load: false, both: false });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let owed = 0;
    const tick = (now: number) => {
      owed = Math.min(owed + (now - last) / 1000, 0.1);
      last = now;
      while (owed >= LOOP_PERIOD) {
        const { volts, sag, load } = live.current;
        const s = sim.current.step(volts, sag, load);
        const buf = samples.current;
        buf.push(s);
        while (buf.length && buf[0].t < s.t - WINDOW_SECONDS) buf.shift();
        owed -= LOOP_PERIOD;
        // Count it once the speed has settled well below what the voltage should give.
        if (s.expected > 5 && s.velocity < s.expected * 0.9 && Math.abs(s.velocity - steadyRPS(volts, { sag, load })) < 1) {
          if (sag && !load) seen.current.sag = true;
          if (load && !sag) seen.current.load = true;
          if (sag && load) seen.current.both = true;
        }
      }
      setFrame((f) => f + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function reset() {
    sim.current = new Sim();
    samples.current = [];
    setVolts(6);
    setSag(false);
    setLoad(false);
  }

  return (
    <div className="lf-playground lf-openloop">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Turn on battery sag and let the speed settle', done: seen.current.sag },
          { label: 'Turn on the load instead', done: seen.current.load },
          { label: 'Turn on both', done: seen.current.both },
        ]}
      />

      <div className="controls">
        <label className="lf-knob">
          <span className="name"><b>Commanded voltage</b></span>
          <input type="range" min={0} max={12} step={0.5} value={volts} onChange={(e) => setVolts(+e.target.value)} />
          <output>{volts.toFixed(1)} V</output>
        </label>
        <div className="lf-seg two" role="group" aria-label="Conditions">
          <button type="button" aria-pressed={sag} onClick={() => setSag(!sag)}>Battery sag</button>
          <button type="button" aria-pressed={load} onClick={() => setLoad(!load)}>Load</button>
        </div>
      </div>

      <Chart
        data={samples.current.slice() as never}
        series={series}
        leftLabel="RPS"
        rightLabel="volts"
        windowSeconds={WINDOW_SECONDS}
        leftSpan={60}
        ariaLabel="Live graph of flywheel velocity, the expected velocity and the commanded voltage"
      />

      <div className="lf-pg-bar">
        <span className="spacer" />
        <button type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true" />Reset</button>
      </div>
    </div>
  );
}
