import { describe, expect, it } from 'vitest';
import { CommandScheduler, type ButtonId, type StepInput } from './commands/scheduler';

const press = (...down: ButtonId[]): StepInput => ({
  buttons: { A: down.includes('A'), B: down.includes('B'), X: down.includes('X'), Y: down.includes('Y') },
});

describe('CommandScheduler', () => {
  it('starts the default command on the first loop', () => {
    const s = new CommandScheduler();
    const t = s.step(press());
    expect(t.marks.hold).toBe('init');
    expect(t.owners.flywheel).toBe('hold');
  });

  it('matches the lesson 2.3 table: press at tick 3, release at tick 6', () => {
    const s = new CommandScheduler();
    const t = [press(), press(), press('A'), press('A'), press('A'), press(), press()].map((i) => s.step(i));
    expect(t[2].calls).toContain('Spin forward.initialize()');
    expect(t[2].calls).toContain('Spin forward.execute()');
    expect(t.map((x) => x.marks.forward)).toEqual([null, null, 'init', 'run', 'run', 'interrupted', null]);
    expect(t[5].calls).toContain('Spin forward.end(true)');
    expect(t[5].calls).not.toContain('Spin forward.execute()');
  });

  it('interrupts the default command, and the default resumes on release', () => {
    const s = new CommandScheduler();
    s.step(press());
    const a = s.step(press('A'));
    expect(a.marks.hold).toBe('interrupted');
    expect(a.owners.flywheel).toBe('forward');
    const r = s.step(press());
    expect(r.owners.flywheel).toBe('hold');
    expect(r.marks.hold).toBe('init');
  });

  it('hands the flywheel from forward to reverse when B joins A', () => {
    const s = new CommandScheduler();
    s.step(press('A'));
    const t = s.step(press('A', 'B'));
    expect(t.marks.forward).toBe('interrupted');
    expect(t.owners.flywheel).toBe('reverse');
    expect(t.volts).toBe(-6);
    // Releasing A afterwards changes nothing.
    expect(s.step(press('B')).owners.flywheel).toBe('reverse');
  });

  it('lets commands on different subsystems run together', () => {
    const s = new CommandScheduler();
    s.step(press('A'));
    const t = s.step(press('A', 'X'));
    expect(t.owners).toEqual({ flywheel: 'forward', elevator: 'elevator' });
  });

  it('ends a self-finishing command with end(false) and returns to the default', () => {
    const s = new CommandScheduler();
    const ticks = [press('Y'), ...Array.from({ length: 10 }, () => press())].map((i) => s.step(i));
    expect(ticks[0].marks.spin).toBe('init');
    expect(ticks[9].marks.spin).toBe('finished');
    expect(ticks[9].calls).toContain('Spin for 10 loops.end(false)');
    expect(ticks[9].owners.flywheel).toBe('hold');
  });

  it('without addRequirements, two commands write the flywheel in the same loop', () => {
    const s = new CommandScheduler();
    const forget = (down: ButtonId[]): StepInput => ({ ...press(...down), forwardForgetsRequirement: true });
    s.step(forget([]));
    const a = s.step(forget(['A']));
    expect(a.marks.hold).toBe('run');
    expect(a.flywheelWriters).toBe(2);
    expect(s.step(forget(['A', 'B'])).marks.forward).toBe('run');
  });
});
