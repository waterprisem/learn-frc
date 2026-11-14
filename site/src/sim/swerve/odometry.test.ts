import { describe, expect, it } from 'vitest';
import { runDrift, seededRandom, type DriftConfig } from './odometry';

const base: DriftConfig = { seed: 7, slip: 0, gyroDrift: 0, vision: false, ambiguityThreshold: 0.2 };
const final = (c: Partial<DriftConfig>, s = 30) => runDrift({ ...base, ...c }, s).at(-1)!.error;
const peak = (c: Partial<DriftConfig>, s = 30) => Math.max(...runDrift({ ...base, ...c }, s).map((x) => x.error));

const mean = (c: Partial<DriftConfig>, s = 60) => { const r = runDrift({ ...base, ...c }, s); return r.reduce((a, x) => a + x.error, 0) / r.length; };

describe('odometry drift run', () => {
  it('is deterministic for a seed and changes with another', () => {
    const a = runDrift({ ...base, slip: 0.05, vision: true }, 10);
    const b = runDrift({ ...base, slip: 0.05, vision: true }, 10);
    expect(b).toEqual(a);
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });

  it('has no error with perfect inputs', () => {
    expect(peak({}, 20)).toBeLessThan(1e-6);
  });

  it('accumulates error from slip and from gyro drift', () => {
    expect(peak({ slip: 0.1 })).toBeGreaterThan(0.3);
    expect(final({ gyroDrift: 0.3 })).toBeGreaterThan(0.3);
  });

  it('vision keeps the error small', () => {
    const cfg = { slip: 0.1, gyroDrift: 1 };
    expect(mean({ ...cfg, vision: true })).toBeLessThan(mean(cfg) / 2);
  });

  it('the threshold decides which measurements are used', () => {
    const events = (thr: number) => runDrift({ ...base, slip: 0.03, vision: true, ambiguityThreshold: thr }, 30).flatMap((s) => (s.event ? [s.event] : []));
    const strict = events(0.2);
    expect(strict.every((e) => !e.accepted || e.ambiguity <= 0.2)).toBe(true);
    expect(strict.some((e) => !e.accepted && e.ambiguity > 0.2)).toBe(true);
    expect(events(1).filter((e) => e.accepted).length).toBeGreaterThan(strict.filter((e) => e.accepted).length);
  });

  it('accepting ambiguous measurements makes the pose worse than rejecting them', () => {
    const cfg = { slip: 0.01, gyroDrift: 0.05, vision: true };
    expect(peak({ ...cfg, ambiguityThreshold: 1 })).toBeGreaterThan(peak({ ...cfg, ambiguityThreshold: 0.2 }));
  });
});
