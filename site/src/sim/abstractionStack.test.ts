import { describe, expect, it } from 'vitest';
import { faults, outcome, path, stackLayers } from './abstractionStack';

describe('abstraction stack', () => {
  it('has the nine steps of the lesson, down then back up', () => {
    expect(path).toHaveLength(9);
    expect(path.filter((p) => p.returning).map((p) => p.layer)).toEqual([5, 2, 0]);
  });

  it('with no fault the signal makes the full trip and every indicator is ok', () => {
    const o = outcome(null);
    expect(o.steps).toHaveLength(9);
    expect(o.stuckAt).toBeNull();
    expect(o.indicators.every((i) => i.ok)).toBe(true);
  });

  it('has one fault per layer, and each one breaks the trip at or below its layer', () => {
    expect(faults.map((f) => f.layer)).toEqual(stackLayers.map((_, i) => i));
    for (const f of faults) {
      const o = outcome(f);
      expect(o.stuckAt).toBe(f.completed);
      expect(path[o.stuckAt!].layer).toBe(f.layer);
      expect(o.indicators.every((i) => i.ok)).toBe(false);
    }
  });

  it('a loose encoder still moves the mechanism, but a stalled motor does not', () => {
    const moves = (layer: number) => outcome(faults[layer]).indicators[2].ok;
    expect(moves(5)).toBe(true);
    expect(moves(4)).toBe(false);
  });
});
