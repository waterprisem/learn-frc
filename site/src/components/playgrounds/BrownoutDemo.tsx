import { RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { batteries, BROWNOUT_VOLTS, LOOP_PERIOD, PowerSim, settledVolts, type BatteryId, type PowerSample } from '../../sim/power/battery';
import Chart, { type ChartSeries } from '../viz/Chart';
import Tasks from './Tasks';

const WINDOW_SECONDS = 8;
const series: ChartSeries[] = [
  { key: 'volts', label: 'Battery voltage', unit: 'V', cssVar: '--sig-measurement', width: 3 },
  { key: 'threshold', label: 'Brownout level', unit: 'V', cssVar: '--danger', dash: '7 5' },
  { key: 'amps', label: 'Total current', unit: 'A', cssVar: '--sig-output', dash: '2 3', axis: 'right' },
];

/** Push with more motors or a higher current limit and watch the battery voltage sag into a brownout. */
export default function BrownoutDemo({ lessonId }: { lessonId?: string }) {
  const [motors, setMotors] = useState(4);
  const [limitAmps, setLimitAmps] = useState(40);
  const [batteryId, setBatteryId] = useState<BatteryId>('fresh');
  const [pushing, setPushing] = useState(false);
  const [, setFrame] = useState(0);

  const sim = useRef<PowerSim | null>(null);
  if (!sim.current) sim.current = new PowerSim();
  const samples = useRef<PowerSample[]>([]);
  const input = { battery: batteries[batteryId], motors, limitAmps, pushing };
  const live = useRef(input);
  live.current = input;
  // What the learner has managed so far, for the task list.
  const seen = useRef({ brownout: false, saved: false, tired: false, cleanSince: 0 });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let owed = 0;
    const tick = (now: number) => {
      owed = Math.min(owed + (now - last) / 1000, 0.1);
      last = now;
      while (owed >= LOOP_PERIOD) {
        const s = sim.current!.step(live.current);
        const buf = samples.current;
        buf.push(s);
        while (buf.length && buf[0].t < s.t - WINDOW_SECONDS) buf.shift();
        owed -= LOOP_PERIOD;

        const { motors, limitAmps, pushing, battery } = live.current;
        const mem = seen.current;
        if (s.brownout) {
          mem.brownout = true;
          mem.cleanSince = s.t;
          // A tired battery browning out where a fresh one would have coped.
          if (battery === batteries.tired && settledVolts(batteries.fresh, motors, limitAmps) > BROWNOUT_VOLTS) mem.tired = true;
        } else if (!pushing || motors < 4) mem.cleanSince = s.t;
        else if (mem.brownout && s.t - mem.cleanSince > 2) mem.saved = true;
      }
      setFrame((f) => f + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function reset() {
    sim.current = new PowerSim();
    samples.current = [];
    setPushing(false);
    setMotors(4);
    setLimitAmps(40);
    setBatteryId('fresh');
  }

  const latest = samples.current[samples.current.length - 1];
  const brownout = !!latest?.brownout;

  return (
    <div className="lf-playground lf-brownout">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Cause a brownout', done: seen.current.brownout },
          { label: 'Push with 4 or more motors for 2 seconds without one', done: seen.current.saved },
          { label: 'Find settings that only brown out on the tired battery', done: seen.current.tired },
        ]}
      />

      <div className="controls">
        <label className="lf-knob">
          <span className="name"><b>Motors pushing</b></span>
          <input type="range" min={0} max={8} step={1} value={motors} onChange={(e) => setMotors(+e.target.value)} />
          <output>{motors}</output>
        </label>
        <label className="lf-knob">
          <span className="name"><b>Current limit per motor</b></span>
          <input type="range" min={20} max={120} step={10} value={limitAmps} onChange={(e) => setLimitAmps(+e.target.value)} />
          <output>{limitAmps} A</output>
        </label>
        <div className="lf-seg two" role="group" aria-label="Battery">
          {(Object.keys(batteries) as BatteryId[]).map((id) => (
            <button key={id} type="button" aria-pressed={batteryId === id} onClick={() => setBatteryId(id)}>
              {id === 'fresh' ? 'Fresh battery' : 'Tired battery'}
              <small>{batteries[id].restVolts} V at rest</small>
            </button>
          ))}
        </div>
      </div>

      <Chart
        data={samples.current.slice() as never}
        series={series}
        leftLabel="volts"
        rightLabel="amps"
        windowSeconds={WINDOW_SECONDS}
        ariaLabel="Live graph of battery voltage, the brownout level and total current"
      />

      <div className="lf-pg-bar">
        <button type="button" className={pushing ? 'primary' : ''} aria-pressed={pushing} onClick={() => setPushing(!pushing)}>
          {pushing ? 'Stop pushing' : 'Push against a wall'}
        </button>
        <span className={`lf-lamp${brownout ? '' : ' on'}`} role="status">
          <span aria-hidden="true" /> Motor outputs: <b>{brownout ? 'disabled (brownout)' : 'enabled'}</b>
        </span>
        <span className="spacer" />
        <button type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true" />Reset</button>
      </div>
    </div>
  );
}
