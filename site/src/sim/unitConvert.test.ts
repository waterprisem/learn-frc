import { describe, expect, it } from 'vitest';
import { convert } from './unitConvert';

describe('unit converter', () => {
  it('matches the lesson 1.8 elevator example', () => {
    const r = convert({ mechanism: 'elevator', direction: 'toMechanism', value: 25, gearRatio: 10, radiusMeters: 0.022 });
    expect(r.result).toBeCloseTo(0.3456, 3);
    expect(r.unit).toBe('meters');
    expect(r.steps[1].value).toBeCloseTo(2.5);
  });

  it('matches the lesson 1.8 arm example', () => {
    const r = convert({ mechanism: 'arm', direction: 'toMechanism', value: 30, gearRatio: 100, radiusMeters: 0 });
    expect(r.result).toBeCloseTo(108);
  });

  it('round-trips', () => {
    const base = { mechanism: 'elevator' as const, gearRatio: 10, radiusMeters: 0.022 };
    const there = convert({ ...base, direction: 'toMechanism', value: 7 });
    const back = convert({ ...base, direction: 'toMotor', value: there.result });
    expect(back.result).toBeCloseTo(7);
    expect(back.unit).toBe('rotations');
  });
});
