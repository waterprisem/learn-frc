import { describe, expect, it } from 'vitest';
import { PIDController } from './control/PIDController';
import { SimpleMotorFeedforward } from './control/SimpleMotorFeedforward';
import { FlywheelPlant } from './plants/flywheel';
import { flywheelPresets, standardSchedule } from './flywheelPresets';
import { runScenario, VELOCITY_TOLERANCE_RPS } from './flywheelSim';

const run = (id: keyof typeof flywheelPresets, loadVolts = 0) =>
  runScenario(flywheelPresets[id].gains, standardSchedule, 6, loadVolts);
const tail = (s: ReturnType<typeof run>) => s.slice(-50); // last second

describe('PIDController (WPILib semantics)', () => {
  it('computes P, I and D terms', () => {
    const pid = new PIDController(2, 0.5, 0.1, 0.02);
    // error 10: P = 20, I = 0.5 * (10 * 0.02) = 0.1, D = 0.1 * (10 / 0.02) = 50
    expect(pid.calculate(0, 10)).toBeCloseTo(70.1);
    expect(pid.getError()).toBe(10);
  });
  it('atSetpoint uses tolerance and is false after reset', () => {
    const pid = new PIDController(1, 0, 0);
    pid.setTolerance(2);
    expect(pid.atSetpoint()).toBe(false);
    pid.calculate(38.5, 40);
    expect(pid.atSetpoint()).toBe(true);
    pid.calculate(37.5, 40);
    expect(pid.atSetpoint()).toBe(false);
    pid.calculate(39, 40);
    pid.reset();
    expect(pid.atSetpoint()).toBe(false);
  });
  it('clamps the integral contribution to ±1 by default', () => {
    const pid = new PIDController(0, 1, 0);
    for (let i = 0; i < 1000; i++) pid.calculate(0, 100);
    expect(pid.calculate(0, 100)).toBeCloseTo(1);
  });
});

describe('SimpleMotorFeedforward', () => {
  it('is kS·sign(v) + kV·v', () => {
    const ff = new SimpleMotorFeedforward(0.2, 0.12);
    expect(ff.calculate(40)).toBeCloseTo(5.0);
    expect(ff.calculate(-40)).toBeCloseTo(-5.0);
    expect(ff.calculate(0)).toBe(0);
  });
});

describe('FlywheelPlant', () => {
  it('has the Kraken free-speed relationship (true kV ≈ 0.12 V/RPS)', () => {
    expect(1 / new FlywheelPlant().rpsPerVolt).toBeCloseTo(0.119, 2);
  });
  it('stays still until voltage beats friction, then settles at (V − friction)·rpsPerVolt', () => {
    const p = new FlywheelPlant();
    for (let i = 0; i < 100; i++) p.update(0.15, 0.02);
    expect(p.velocityRPS).toBe(0);
    for (let i = 0; i < 500; i++) p.update(6, 0.02);
    expect(p.velocityRPS).toBeCloseTo(5.8 * p.rpsPerVolt, 1);
  });
  it('coasts to a stop and does not reverse', () => {
    const p = new FlywheelPlant();
    for (let i = 0; i < 200; i++) p.update(6, 0.02);
    for (let i = 0; i < 2000; i++) p.update(0, 0.02);
    expect(p.velocityRPS).toBe(0);
  });
});

describe('closed-loop flywheel scenarios', () => {
  it('tuned gains reach 20, 40 and 70 RPS within tolerance without oscillating', () => {
    for (const target of [20, 40, 70]) {
      const s = runScenario(flywheelPresets.tuned.gains, [{ at: 0, target }], 5);
      for (const x of tail(s)) {
        expect(Math.abs(x.error)).toBeLessThan(VELOCITY_TOLERANCE_RPS);
        expect(x.atTarget).toBe(true);
      }
      expect(Math.max(...s.map((x) => x.velocity))).toBeLessThan(target * 1.05);
    }
  });
  it('all zeros does nothing', () => {
    expect(Math.max(...run('zero').map((x) => x.velocity))).toBe(0);
  });
  it('kV too small leaves the wheel below target (positive steady-state error)', () => {
    const end = tail(run('kv-low'));
    expect(end.every((x) => x.error > 5 && !x.atTarget)).toBe(true);
  });
  it('kP too large keeps oscillating', () => {
    const end = tail(run('kp-high')).map((x) => x.velocity);
    expect(Math.max(...end) - Math.min(...end)).toBeGreaterThan(5);
  });
  it('feedforward alone cannot fight a load; feedback shrinks the error', () => {
    const ffOnly = Math.abs(run('no-feedback', 0.5).at(-1)!.error);
    const withP = Math.abs(run('tuned', 0.5).at(-1)!.error);
    expect(ffOnly).toBeGreaterThan(VELOCITY_TOLERANCE_RPS);
    expect(withP).toBeLessThan(ffOnly * 0.7);
  });
  it('releasing the button applies 0 V', () => {
    const s = runScenario(flywheelPresets.tuned.gains, [{ at: 0, target: 40 }, { at: 2, target: null }], 3);
    expect(s.at(-1)!.output).toBe(0);
    expect(s.at(-1)!.velocity).toBeLessThan(35);
  });
});
