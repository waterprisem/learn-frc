import { describe, expect, it } from 'vitest';
import { planFauxIntake, planRaw, planSafeMove, poses, Superstructure } from './superstructure';

const run = (s: Superstructure, seconds: number) => {
  let risk = false;
  for (let i = 0; i < seconds * 50; i++) {
    s.step(0.02);
    risk ||= s.collisionRisk;
  }
  return risk;
};

describe('planSafeMove', () => {
  it('moves both together when the arm is folded and the target is folded', () => {
    expect(planSafeMove(45, poses.L4).transition).toBe('PARALLEL');
    expect(planSafeMove(20, poses.L3).transition).toBe('PARALLEL');
  });
  it('goes arm first when the arm is outside the envelope', () => {
    const p = planSafeMove(-90, poses.L2);
    expect(p.transition).toBe('ARM_FIRST');
    expect(p.stages).toEqual([{ arm: 45 }, { height: 0.42 }, { arm: -10 }]);
  });
  it('goes elevator first when the target arm is outside the envelope', () => {
    expect(planSafeMove(0, { label: 'x', height: 0.5, arm: 80 }).transition).toBe('ELEVATOR_FIRST');
  });
});

describe('faux intake', () => {
  it('is blocked below 0.64 m and moves nothing', () => {
    const p = planFauxIntake(0.42);
    expect(p.transition).toBe('BLOCKED');
    expect(p.stages).toEqual([]);
  });
  it('arm down, dip to the line, return, from L4', () => {
    const s = new Superstructure();
    s.height = 1.08;
    s.arm = -20;
    s.start(planFauxIntake(1.08));
    expect(run(s, 6)).toBe(false);
    expect(s.arm).toBe(-90);
    expect(s.height).toBeCloseTo(1.08);
  });
});

describe('collision risk', () => {
  it('appears when the carriage moves with the arm extended and no safety rule', () => {
    const s = new Superstructure();
    s.arm = -90;
    s.start(planRaw(poses.L2));
    expect(run(s, 4)).toBe(true);
  });
  it('never appears with the safe plan from the same start', () => {
    const s = new Superstructure();
    s.arm = -90;
    s.start(planSafeMove(s.arm, poses.L2));
    expect(run(s, 6)).toBe(false);
    expect(s.height).toBeCloseTo(0.42);
    expect(s.arm).toBeCloseTo(-10);
  });
});
