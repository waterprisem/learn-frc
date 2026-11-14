import { describe, expect, it } from 'vitest';
import { FlywheelSim, type FlywheelGains, type FlywheelSample } from '../../sim/flywheelSim';
import { buildGuideContext, flywheelGuide } from './flywheelGuide';

/** Plays the playground without the UI: change gains or buttons, let time pass, ask the coach. */
function player() {
  let gains: FlywheelGains = { kP: 0, kI: 0, kD: 0, kS: 0, kV: 0 };
  let target: number | null = null;
  let load = false;
  let since = 0;
  const sim = new FlywheelSim(gains);
  const samples: FlywheelSample[] = [];
  const memos: Record<number, Record<string, any>> = {};
  return {
    set(g: Partial<FlywheelGains>) { gains = { ...gains, ...g }; sim.setGains(gains); },
    hold(t: number | null) { target = t; since = sim.t; },
    load(on: boolean) { load = on; sim.plant.loadVolts = on ? 0.5 : 0; },
    /** Run for some seconds, evaluating the step every loop like the UI does. Returns the last result. */
    run(step: number, seconds: number) {
      let result = { done: false, tone: 'info', note: '' } as ReturnType<(typeof flywheelGuide)[number]['evaluate']>;
      let everDone = false;
      for (let i = 0; i < seconds * 50; i++) {
        samples.push(sim.step(target));
        result = flywheelGuide[step].evaluate(buildGuideContext(samples, gains, target, load, sim.t - since), (memos[step] ??= {}));
        everDone ||= result.done;
      }
      return { ...result, everDone };
    },
  };
}

describe('flywheel guide: following the instructions passes every step', () => {
  it('walks the whole tuning procedure', () => {
    const p = player();

    expect(p.run(0, 1).done).toBe(false); // nothing pressed yet
    p.hold(40);
    expect(p.run(0, 1.5).done).toBe(true);

    p.set({ kS: 0.1 });
    expect(p.run(1, 1).done).toBe(false); // friction still wins
    p.set({ kS: 0.6 });
    expect(p.run(1, 1).tone).toBe('warn'); // far more than needed
    p.set({ kS: 0.22 });
    expect(p.run(1, 1).done).toBe(true);

    p.set({ kV: 0.06 });
    expect(p.run(2, 4).note).toMatch(/too small/);
    p.set({ kV: 0.12 });
    expect(p.run(2, 4).done).toBe(false); // only 40 RPS checked so far
    p.hold(20);
    p.run(2, 4);
    p.hold(70);
    expect(p.run(2, 4).done).toBe(true);

    p.set({ kP: 0.08 });
    p.hold(40);
    const step4 = p.run(3, 4);
    expect(step4.done).toBe(true);

    p.set({ kV: 0.06 });
    expect(p.run(4, 4).done).toBe(false); // seen one problem, not both
    p.set({ kV: 0.12, kP: 2.5 });
    expect(p.run(4, 4).everDone).toBe(true);

    p.set({ kP: 0 });
    p.load(true);
    expect(p.run(5, 4).note).toMatch(/misses by/);
    p.set({ kP: 0.3 });
    expect(p.run(5, 4).done).toBe(true);
  });

  it('does not call a normal spin-up "swinging"', () => {
    const p = player();
    p.set({ kS: 0.2, kV: 0.12, kP: 0.08 });
    p.hold(70);
    for (let t = 0; t < 30; t++) expect(p.run(3, 0.1).tone).not.toBe('warn');
  });

  it('flags too much kP as swinging', () => {
    const p = player();
    p.set({ kS: 0.2, kV: 0.12, kP: 2.5 });
    p.hold(40);
    expect(p.run(3, 4).tone).toBe('warn');
  });
});
