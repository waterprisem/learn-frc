import { describe, expect, it } from 'vitest';
import { gearRatio, gearResult, MOTOR } from './gearing';

describe('gearing', () => {
  it('ratio is driven over driver teeth', () => {
    expect(gearRatio({ driverTeeth: 12, drivenTeeth: 60 })).toBe(5);
  });

  it('a 10:1 reduction is ten times slower and ten times stronger', () => {
    const r = gearResult({ driverTeeth: 10, drivenTeeth: 100 });
    expect(r.kind).toBe('reduction');
    expect(r.speedRPS).toBeCloseTo(MOTOR.freeSpeedRPS / 10);
    expect(r.torqueNm).toBeCloseTo(MOTOR.stallTorqueNm * 10);
  });

  it('speed times torque stays constant', () => {
    const a = gearResult({ driverTeeth: 12, drivenTeeth: 36 });
    const b = gearResult({ driverTeeth: 20, drivenTeeth: 16 });
    expect(a.speedRPS * a.torqueNm).toBeCloseTo(b.speedRPS * b.torqueNm);
  });

  it('classifies direct and overdrive', () => {
    expect(gearResult({ driverTeeth: 20, drivenTeeth: 20 }).kind).toBe('direct');
    expect(gearResult({ driverTeeth: 30, drivenTeeth: 10 }).kind).toBe('overdrive');
  });
});
