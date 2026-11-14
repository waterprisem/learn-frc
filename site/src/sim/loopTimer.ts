/** A TimedRobot-style loop: a tick is due every 20 ms, but cannot start until the previous one has finished. */
export const PERIOD_MS = 20;
/** Time the code takes with nothing slowing it down. */
export const BASE_WORK_MS = 2;

export interface LoopTick {
  n: number;
  dueMs: number; // when the tick was scheduled to start
  startMs: number;
  endMs: number;
  /** The work took longer than the time left in its slot, so the next tick cannot start on time. */
  overrun: boolean;
  lateMs: number;
}

export class LoopTimer {
  ticks: LoopTick[] = [];
  private n = 0;
  private cursor = 0; // when the previous tick finished

  /**
   * Run every tick that would have started by `nowMs`. `extraDelayMs` is the slow code added to each tick
   * that starts now.
   */
  advanceTo(nowMs: number, extraDelayMs: number): LoopTick[] {
    const fresh: LoopTick[] = [];
    for (;;) {
      const dueMs = this.n * PERIOD_MS;
      const startMs = Math.max(dueMs, this.cursor);
      if (startMs > nowMs) break;
      const endMs = startMs + BASE_WORK_MS + extraDelayMs;
      const tick: LoopTick = { n: this.n, dueMs, startMs, endMs, overrun: endMs > dueMs + PERIOD_MS, lateMs: startMs - dueMs };
      this.n += 1;
      this.cursor = endMs;
      fresh.push(tick);
    }
    this.ticks.push(...fresh);
    return fresh;
  }
}

/** How many ticks started in the last `windowMs` before `nowMs`, as a per-second rate. */
export function callsPerSecond(ticks: LoopTick[], nowMs: number, windowMs = 1000): number {
  const from = nowMs - windowMs;
  const count = ticks.filter((t) => t.startMs > from && t.startMs <= nowMs).length;
  return (count * 1000) / windowMs;
}
