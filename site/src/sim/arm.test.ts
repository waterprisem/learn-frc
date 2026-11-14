import { describe, expect, it } from 'vitest';
import { armPresets, standardArmSchedule } from './armPresets';
import { POSITION_TOLERANCE_DEGREES, runArmScenario } from './armSim';
import { ArmFeedforward } from './control/ArmFeedforward';
import { ArmPlant } from './plants/arm';

const run = (id: keyof typeof armPresets, bug = false, seconds = 6) => runArmScenario(armPresets[id].gains, standardArmSchedule, seconds, bug);

describe('ArmFeedforward', () => {
  it('scales kG by the cosine of the angle', () => {
    const ff = new ArmFeedforward(0, 0.16, 0);
    expect(ff.calculate(0, 0)).toBeCloseTo(0.16);
    expect(ff.calculate(Math.PI / 3, 0)).toBeCloseTo(0.08);
    expect(ff.calculate(Math.PI / 2, 0)).toBeCloseTo(0, 10);
  });
});

describe('ArmPlant', () => {
  it('has a true kG close to the lab value of 0.16 V', () => {
    expect(new ArmPlant().gravityVolts).toBeGreaterThan(0.1);
    expect(new ArmPlant().gravityVolts).toBeLessThan(0.25);
  });
  it('falls to the lower hard stop with no power and holds with the gravity volts', () => {
    const p = new ArmPlant();
    for (let i = 0; i < 300; i++) p.update(0, 0.02);
    expect(p.angleRadians).toBeCloseTo((-25 * Math.PI) / 180);
    const q = new ArmPlant();
    for (let i = 0; i < 100; i++) q.update(q.gravityVolts, 0.02);
    expect(Math.abs(q.angleRadians)).toBeLessThan(0.01);
  });
  it('stops at the upper hard stop', () => {
    const p = new ArmPlant();
    for (let i = 0; i < 300; i++) p.update(12, 0.02);
    expect(p.angleRadians).toBeCloseTo((115 * Math.PI) / 180);
  });
});

describe('arm scenarios', () => {
  it('the lab gains reach level 3 within tolerance', () => {
    const s = run('lab');
    expect(s.at(-1)!.atTarget).toBe(true);
    expect(Math.abs(s.at(-1)!.angle - 95)).toBeLessThan(POSITION_TOLERANCE_DEGREES);
  });
  it('the radians bug leaves the arm worse off than the lab gains', () => {
    const good = run('lab');
    const bad = run('lab', true);
    const worst = (s: typeof good) => Math.max(...s.slice(60).map((x) => Math.abs(x.angle - x.setpoint)));
    expect(worst(bad)).toBeGreaterThan(worst(good));
  });
  it('at home the radians bug gives the same gravity volts', () => {
    expect(run('lab', true)[5].gravityVolts).toBeCloseTo(run('lab')[5].gravityVolts, 6);
  });
  it('kP far too large oscillates', () => {
    const s = run('kp-high');
    expect(Math.max(...s.map((x) => x.angle))).toBeGreaterThan(100);
  });
});
