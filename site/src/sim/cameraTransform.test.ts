import { describe, expect, it } from 'vitest';
import { compose, inverse, REAL_MOUNT, sampleAt, type Mount } from './vision/cameraTransform';

const times = [0, 1.3, 4, 7.7, 12];

describe('robot-to-camera transform', () => {
  it('inverse undoes compose', () => {
    const a = { x: 2, y: -1, heading: 70 };
    const id = compose(a, inverse(a));
    expect(id.x).toBeCloseTo(0);
    expect(id.y).toBeCloseTo(0);
    expect(id.heading).toBeCloseTo(0);
  });

  it('a correct transform recovers the true pose at every moment', () => {
    for (const t of times) {
      const s = sampleAt(t, REAL_MOUNT);
      expect(s.error).toBeLessThan(1e-9);
      expect(s.headingError).toBeCloseTo(0);
    }
  });

  it('a yaw error becomes an equal heading error', () => {
    const wrong: Mount = { ...REAL_MOUNT, heading: REAL_MOUNT.heading + 10 };
    for (const t of times) expect(Math.abs(sampleAt(t, wrong).headingError)).toBeCloseTo(10, 6);
  });

  it('an x error of 0.1 m is a 0.1 m error, pointing along the robot, so it swings as the robot turns', () => {
    const wrong: Mount = { ...REAL_MOUNT, x: REAL_MOUNT.x + 0.1 };
    const a = sampleAt(0, wrong);
    const b = sampleAt(8, wrong);
    expect(a.error).toBeCloseTo(0.1, 6);
    expect(b.error).toBeCloseTo(0.1, 6);
    expect(Math.atan2(a.errorY, a.errorX)).not.toBeCloseTo(Math.atan2(b.errorY, b.errorX), 1);
  });

  it('a yaw error also moves the position unless the camera sits at the robot center', () => {
    const wrong: Mount = { ...REAL_MOUNT, heading: 40 };
    expect(sampleAt(2, wrong).error).toBeGreaterThan(0.05);
    const centered: Mount = { x: 0, y: 0, heading: 15 };
    expect(sampleAt(2, { ...centered, heading: 40 }, centered).error).toBeLessThan(1e-9);
  });
});
