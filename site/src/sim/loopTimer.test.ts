import { describe, expect, it } from 'vitest';
import { callsPerSecond, LoopTimer, PERIOD_MS } from './loopTimer';

describe('loop timer', () => {
  it('fires every 20 ms with fast code', () => {
    const t = new LoopTimer();
    t.advanceTo(1000, 0);
    expect(t.ticks.slice(0, 3).map((x) => x.startMs)).toEqual([0, 20, 40]);
    expect(t.ticks.every((x) => !x.overrun && x.lateMs === 0)).toBe(true);
    expect(callsPerSecond(t.ticks, 1000)).toBe(50);
  });

  it('overruns when the code takes longer than 20 ms, and the next tick starts late', () => {
    const t = new LoopTimer();
    t.advanceTo(200, 30); // 32 ms of work
    expect(t.ticks[0].overrun).toBe(true);
    expect(t.ticks[1].startMs).toBe(32);
    expect(t.ticks[1].lateMs).toBe(12);
  });

  it('runs fewer loops per second while overrunning', () => {
    const t = new LoopTimer();
    t.advanceTo(1000, 38); // 40 ms of work per tick
    expect(callsPerSecond(t.ticks, 1000)).toBeLessThan(30);
  });

  it('recovers once the code is fast again', () => {
    const t = new LoopTimer();
    t.advanceTo(100, 30);
    t.advanceTo(1000, 0);
    const last = t.ticks[t.ticks.length - 1];
    expect(last.overrun).toBe(false);
    expect(last.lateMs).toBe(0);
    expect(last.startMs % PERIOD_MS).toBe(0);
  });

  it('exactly 20 ms of work is not an overrun', () => {
    const t = new LoopTimer();
    t.advanceTo(0, 18);
    expect(t.ticks[0].endMs).toBe(20);
    expect(t.ticks[0].overrun).toBe(false);
  });
});
