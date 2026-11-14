import { describe, expect, it } from 'vitest';
import { desaturate, optimize, toChassisSpeeds, toModuleStates } from './swerve/kinematics';
import { SwerveSim } from './swerve/swerveSim';

describe('toModuleStates (lesson 6.2 table)', () => {
  it('forward: every wheel 2 m/s at 0°', () => {
    const s = toModuleStates({ vx: 2, vy: 0, omega: 0 });
    for (const n of ['FL', 'FR', 'BL', 'BR'] as const) expect(s[n]).toEqual({ speed: 2, angle: 0 });
  });
  it('strafe left: every wheel 2 m/s at 90°', () => {
    const s = toModuleStates({ vx: 0, vy: 2, omega: 0 });
    expect(s.FL.angle).toBeCloseTo(90);
    expect(s.BR.speed).toBeCloseTo(2);
  });
  it('spin: 0.40 m/s each at 135, 45, 225 (-135), -45', () => {
    const s = toModuleStates({ vx: 0, vy: 0, omega: 1 });
    expect(s.FL.speed).toBeCloseTo(0.4, 2);
    expect([s.FL.angle, s.FR.angle, s.BL.angle, s.BR.angle].map(Math.round)).toEqual([135, 45, -135, -45]);
  });
  it('forward plus spin', () => {
    const s = toModuleStates({ vx: 2, vy: 0, omega: 1 });
    expect(s.FL.speed).toBeCloseTo(1.74, 2);
    expect(s.FL.angle).toBeCloseTo(9.4, 1);
    expect(s.FR.speed).toBeCloseTo(2.3, 2);
    expect(s.FR.angle).toBeCloseTo(7.1, 1);
  });
});

describe('desaturate, optimize and the round trip', () => {
  it('scales all wheels down together', () => {
    const s = desaturate(toModuleStates({ vx: 6, vy: 0, omega: 3 }));
    expect(Math.max(...Object.values(s).map((m) => m.speed))).toBeCloseTo(4.5);
  });
  it('flips a wheel that would turn more than 90°', () => {
    expect(optimize({ speed: 2, angle: 170 }, 0)).toEqual({ speed: -2, angle: -10 });
    expect(optimize({ speed: 2, angle: 40 }, 0)).toEqual({ speed: 2, angle: 40 });
  });
  it('recovers the requested chassis speeds', () => {
    const c = toChassisSpeeds(toModuleStates({ vx: 1.2, vy: -0.7, omega: 0.9 }));
    expect(c.vx).toBeCloseTo(1.2);
    expect(c.vy).toBeCloseTo(-0.7);
    expect(c.omega).toBeCloseTo(0.9);
  });
});

describe('SwerveSim', () => {
  it('drives forward along the heading', () => {
    const sim = new SwerveSim();
    for (let i = 0; i < 50; i++) sim.step({ vx: 1, vy: 0, omega: 0 });
    expect(sim.pose.x).toBeCloseTo(4, 2);
  });
  it('keeps the wheel angle when stopped, and flips instead of swinging 180°', () => {
    const sim = new SwerveSim();
    sim.step({ vx: 1, vy: 0, omega: 0 });
    sim.step({ vx: -1, vy: 0, omega: 0 });
    expect(sim.states.FL.angle).toBeCloseTo(0);
    expect(sim.states.FL.speed).toBeCloseTo(-1);
    sim.step({ vx: 0, vy: 0, omega: 0 });
    expect(sim.states.FL.angle).toBeCloseTo(0);
  });
});
