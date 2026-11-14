import { describe, expect, it } from 'vitest';
import { clampStep, journey, layers } from './buttonJourney';

describe('button journey', () => {
  it('has the 14 numbered steps of lesson 1.10', () => {
    expect(journey).toHaveLength(14);
    journey.forEach((st, i) => expect(st.n).toBe(i + 1));
  });

  it('runs steps 5, 6, 7 and 13 inside the 20 ms loop', () => {
    expect(journey.filter((st) => st.inLoop).map((st) => st.n)).toEqual([5, 6, 7, 13]);
  });

  it('uses only the five named layers, outbound then return from step 11', () => {
    expect(journey.every((st) => layers.includes(st.layer))).toBe(true);
    expect(journey.filter((st) => st.returning).map((st) => st.n)).toEqual([11, 12, 13, 14]);
  });

  it('clamps the step index', () => {
    expect(clampStep(-1)).toBe(0);
    expect(clampStep(99)).toBe(13);
  });
});
