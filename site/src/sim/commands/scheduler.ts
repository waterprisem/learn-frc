/**
 * A small model of WPILib's CommandScheduler.run(): subsystem periodic, trigger polling,
 * execute / isFinished / end for each scheduled command, then default commands.
 * One call to `step` is one 20 ms loop.
 */
export type SubsystemId = 'flywheel' | 'elevator';
export type CommandId = 'forward' | 'reverse' | 'elevator' | 'spin' | 'hold';
export type ButtonId = 'A' | 'B' | 'X' | 'Y';
export type Mark = 'init' | 'run' | 'interrupted' | 'finished' | null;

export interface CommandDef {
  id: CommandId;
  name: string;
  requires: SubsystemId[];
  /** Voltage this command asks the flywheel for in execute(), if it drives the flywheel. */
  flywheelVolts?: number;
  /** isFinished() turns true after this many execute() calls. */
  finishesAfter?: number;
}

export const commands: Record<CommandId, CommandDef> = {
  forward: { id: 'forward', name: 'Spin forward', requires: ['flywheel'], flywheelVolts: 6 },
  reverse: { id: 'reverse', name: 'Spin reverse', requires: ['flywheel'], flywheelVolts: -6 },
  elevator: { id: 'elevator', name: 'Raise elevator', requires: ['elevator'] },
  spin: { id: 'spin', name: 'Spin for 10 loops', requires: ['flywheel'], flywheelVolts: 3, finishesAfter: 10 },
  hold: { id: 'hold', name: 'Hold 0 V (default)', requires: ['flywheel'], flywheelVolts: 0 },
};

export const commandOrder: CommandId[] = ['forward', 'reverse', 'elevator', 'spin', 'hold'];

/** Which button starts which command, and how (whileTrue cancels on release, onTrue does not). */
export const bindings: { button: ButtonId; command: CommandId; mode: 'whileTrue' | 'onTrue' }[] = [
  { button: 'A', command: 'forward', mode: 'whileTrue' },
  { button: 'B', command: 'reverse', mode: 'whileTrue' },
  { button: 'X', command: 'elevator', mode: 'whileTrue' },
  { button: 'Y', command: 'spin', mode: 'onTrue' },
];

export const defaultCommands: Partial<Record<SubsystemId, CommandId>> = { flywheel: 'hold' };

export interface StepInput {
  buttons: Record<ButtonId, boolean>;
  /** The "spin forward" command was written without addRequirements. */
  forwardForgetsRequirement?: boolean;
}

export interface TickRecord {
  tick: number;
  marks: Record<CommandId, Mark>;
  /** Method calls this loop, in order. */
  calls: string[];
  owners: Record<SubsystemId, CommandId | null>;
  /** Commands that wrote a flywheel voltage this loop. */
  flywheelWriters: number;
  /** The voltage the flywheel ended up with (last write wins). */
  volts: number;
}

interface Running {
  id: CommandId;
  requires: SubsystemId[];
  executions: number;
}

export class CommandScheduler {
  private tick = 0;
  private scheduled: Running[] = [];
  private prev: Record<ButtonId, boolean> = { A: false, B: false, X: false, Y: false };

  step(input: StepInput): TickRecord {
    this.tick += 1;
    const marks: Record<CommandId, Mark> = { forward: null, reverse: null, elevator: null, spin: null, hold: null };
    const calls: string[] = [];
    const rank: Record<Exclude<Mark, null>, number> = { run: 1, init: 2, interrupted: 3, finished: 4 };
    const mark = (id: CommandId, m: Exclude<Mark, null>) => {
      if (!marks[id] || rank[m] > rank[marks[id]!]) marks[id] = m;
    };
    const name = (id: CommandId) => commands[id].name;

    const cancel = (r: Running) => {
      this.scheduled = this.scheduled.filter((s) => s !== r);
      calls.push(`${name(r.id)}.end(true)`);
      mark(r.id, 'interrupted');
    };
    const schedule = (id: CommandId) => {
      if (this.scheduled.some((s) => s.id === id)) return;
      const requires = id === 'forward' && input.forwardForgetsRequirement ? [] : commands[id].requires;
      for (const other of this.scheduled.filter((s) => s.requires.some((r) => requires.includes(r)))) cancel(other);
      this.scheduled.push({ id, requires, executions: 0 });
      calls.push(`${name(id)}.initialize()`);
      mark(id, 'init');
    };

    // 1. Triggers: a press schedules, and a release cancels a whileTrue command.
    for (const b of bindings) {
      const now = input.buttons[b.button];
      if (now && !this.prev[b.button]) schedule(b.command);
      if (!now && this.prev[b.button] && b.mode === 'whileTrue') {
        const r = this.scheduled.find((s) => s.id === b.command);
        if (r) cancel(r);
      }
    }
    this.prev = { ...input.buttons };

    // 2. Run each scheduled command.
    let flywheelWriters = 0;
    let volts = 0;
    for (const r of [...this.scheduled]) {
      const def = commands[r.id];
      r.executions += 1;
      calls.push(`${def.name}.execute()`);
      mark(r.id, 'run');
      if (def.flywheelVolts !== undefined) {
        flywheelWriters += 1;
        volts = def.flywheelVolts;
      }
      if (def.finishesAfter !== undefined && r.executions >= def.finishesAfter) {
        this.scheduled = this.scheduled.filter((s) => s !== r);
        calls.push(`${def.name}.end(false)`);
        mark(r.id, 'finished');
      }
    }

    // 3. Default commands for subsystems nobody requires.
    for (const [sub, id] of Object.entries(defaultCommands) as [SubsystemId, CommandId][]) {
      if (!this.scheduled.some((s) => s.requires.includes(sub))) schedule(id);
    }

    const owners: Record<SubsystemId, CommandId | null> = { flywheel: null, elevator: null };
    for (const sub of Object.keys(owners) as SubsystemId[]) {
      owners[sub] = this.scheduled.find((s) => s.requires.includes(sub))?.id ?? null;
    }
    return { tick: this.tick, marks, calls, owners, flywheelWriters, volts };
  }
}
