import { describe, expect, it } from 'vitest';
import { absoluteReading, home, initialEncoder, powerCycle, relativeError, relativeReading, setShaft } from './encoders';

describe('encoders', () => {
  it('both agree at the start', () => {
    const s = initialEncoder();
    expect(relativeReading(s)).toBe(90);
    expect(relativeError(s)).toBe(0);
  });

  it('power cycle zeroes the relative encoder but not the absolute one', () => {
    const s = powerCycle(setShaft(initialEncoder(), 120));
    expect(relativeReading(s)).toBe(0);
    expect(absoluteReading(s)).toBe(120);
    expect(relativeError(s)).toBe(-120);
  });

  it('relative keeps counting from the new zero', () => {
    const s = setShaft(powerCycle(initialEncoder()), 100);
    expect(relativeReading(s)).toBe(10);
  });

  it('homing makes both agree again', () => {
    const s = home(powerCycle(setShaft(initialEncoder(), 200)));
    expect(s.shaft).toBe(0);
    expect(relativeError(s)).toBe(0);
    expect(relativeError(setShaft(s, 45))).toBe(0);
  });

  it('wraps angles', () => {
    expect(absoluteReading(setShaft(initialEncoder(), -30))).toBe(330);
  });
});
