import { describe, expect, it } from 'vitest';
import { MAX_OMEGA, MAX_SPEED, runAlign, STALE_SECONDS, TOLERANCE_METERS } from './vision/alignToTag';

const good = { x: 2.5, y: 2.5, rot: 3 };

describe('align to tag', () => {
  it('drives to the target pose and finishes with all three errors inside tolerance', () => {
    const s = runAlign(good, 10);
    const end = s.at(-1)!;
    expect(end.aligned).toBe(true);
    expect(Math.abs(end.errorX)).toBeLessThan(TOLERANCE_METERS);
    expect(Math.abs(end.errorY)).toBeLessThan(TOLERANCE_METERS);
    expect(Math.abs(end.errorRot)).toBeLessThan(0.04);
    expect(end.vx).toBe(0);
  });

  it('does not finish while one axis is still out of tolerance', () => {
    const s = runAlign({ x: 2.5, y: 2.5, rot: 0 }, 8);
    expect(s.at(-1)!.aligned).toBe(false);
    expect(Math.abs(s.at(-1)!.errorRot)).toBeGreaterThan(0.5);
  });

  it('clamps the outputs', () => {
    const s = runAlign({ x: 50, y: 50, rot: 50 }, 3);
    for (const x of s) {
      expect(Math.abs(x.vx)).toBeLessThanOrEqual(MAX_SPEED + 1e-9);
      expect(Math.abs(x.omega)).toBeLessThanOrEqual(MAX_OMEGA + 1e-9);
    }
  });

  it('turns the short way round', () => {
    const s = runAlign(good, 0.1);
    // start heading -30, target 90: 120 degrees counter-clockwise
    expect(s[0].errorRot).toBeCloseTo((120 * Math.PI) / 180, 6);
    expect(s[1].omega).toBeGreaterThan(0);
  });

  it('stops after 0.5 s without vision and resumes when the tag returns', () => {
    const s = runAlign(good, 6, [[1, 3]]);
    const at = (t: number) => s[Math.round(t / 0.02)];
    expect(at(1.2).stopped).toBe(false);
    expect(at(1 + STALE_SECONDS + 0.1).stopped).toBe(true);
    expect(at(1 + STALE_SECONDS + 0.1).vx).toBe(0);
    // Once the outputs are zero the robot coasts to a halt and stays there.
    const a = at(2.5).pose;
    const b = at(2.9).pose;
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(1e-6);
    expect(at(3.2).stopped).toBe(false);
    expect(s.at(-1)!.aligned).toBe(true);
  });

  it('never drives toward the target before vision is lost for good', () => {
    const s = runAlign(good, 5, [[0.6, 5]]);
    expect(s.at(-1)!.aligned).toBe(false);
    expect(s.at(-1)!.stopped).toBe(true);
  });
});
