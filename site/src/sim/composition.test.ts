import { describe, expect, it } from 'vitest';
import { runComposition, type Child } from './commands/composition';

const kids: Child[] = [
  { name: 'Elevator', duration: 1.2 },
  { name: 'Arm', duration: 0.8 },
  { name: 'Flywheel', duration: 2 },
];

describe('runComposition', () => {
  it('sequence runs one after another and ends with the last', () => {
    const r = runComposition('sequence', kids);
    expect(r.end).toBeCloseTo(4);
    expect(r.bars.map((b) => b.start)).toEqual([0, 1.2, 2]);
    expect(r.bars.some((b) => b.cancelled)).toBe(false);
  });
  it('parallel ends when the last one ends', () => {
    const r = runComposition('parallel', kids);
    expect(r.end).toBe(2);
    expect(r.bars.some((b) => b.cancelled)).toBe(false);
  });
  it('race ends with the first and cancels the rest', () => {
    const r = runComposition('race', kids);
    expect(r.end).toBe(0.8);
    expect(r.bars.map((b) => b.cancelled)).toEqual([true, false, true]);
  });
  it('deadline ends with its main command and cancels longer ones', () => {
    const r = runComposition('deadline', kids, 0);
    expect(r.end).toBe(1.2);
    expect(r.bars.map((b) => b.cancelled)).toEqual([false, false, true]);
  });
});
