import { describe, expect, it } from 'vitest';
import { appliedVolts, LOAD_VOLTS, OpenLoopFlywheel, steadyRPS } from './openLoop';

function settle(volts: number, sag: boolean, load: boolean) {
  const sim = new OpenLoopFlywheel();
  let s = sim.step(volts, sag, load);
  for (let i = 0; i < 300; i++) s = sim.step(volts, sag, load);
  return s;
}

describe('open-loop flywheel', () => {
  it('settles at the predicted speed', () => {
    const s = settle(6, false, false);
    expect(s.velocity).toBeCloseTo(steadyRPS(6), 0);
    expect(s.velocity).toBeCloseTo(s.expected, 0);
  });

  it('is slower with battery sag at the same commanded voltage', () => {
    expect(settle(6, true, false).velocity).toBeLessThan(settle(6, false, false).velocity);
    expect(appliedVolts(6, true)).toBeLessThan(6);
  });

  it('is slower with a load and never changes the commanded voltage', () => {
    const loaded = settle(6, false, true);
    expect(loaded.velocity).toBeLessThan(settle(6, false, false).velocity);
    expect(loaded.commanded).toBe(6);
    expect(steadyRPS(6, { load: true })).toBeCloseTo(steadyRPS(6) - LOAD_VOLTS * (steadyRPS(6) / (6 - 0.2)), 3);
  });

  it('does not move below the friction voltage', () => {
    expect(steadyRPS(0.1)).toBe(0);
  });
});
