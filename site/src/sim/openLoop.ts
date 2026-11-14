import { FlywheelPlant } from './plants/flywheel';

export const LOOP_PERIOD = 0.02;
/** Battery voltage the flywheel was characterised at. */
export const NOMINAL_VOLTS = 12;
/** Battery voltage while other mechanisms draw current. */
export const SAGGED_VOLTS = 10;
/** Extra drag from a game piece squeezed by the wheel. */
export const LOAD_VOLTS = 1.5;

export interface OpenLoopSample {
  [key: string]: number;
  t: number;
  commanded: number; // what the code asked for
  applied: number; // what the motor really gets
  velocity: number; // RPS
  expected: number; // steady-state RPS for the commanded voltage on a healthy battery with no load
}

/** Steady-state speed (RPS) for a voltage, sag and load. Zero if the motor cannot overcome drag. */
export function steadyRPS(volts: number, opts: { sag?: boolean; load?: boolean } = {}): number {
  const plant = new FlywheelPlant({ loadVolts: opts.load ? LOAD_VOLTS : 0 });
  const applied = appliedVolts(volts, !!opts.sag);
  const net = applied - plant.frictionVolts - plant.loadVolts;
  return net > 0 ? net * plant.rpsPerVolt : 0;
}

/** A motor controller scales the request by battery voltage / nominal, so a sagging battery delivers less. */
export function appliedVolts(commanded: number, sag: boolean): number {
  return commanded * ((sag ? SAGGED_VOLTS : NOMINAL_VOLTS) / NOMINAL_VOLTS);
}

/** Open-loop flywheel: a fixed voltage request, never corrected by the measured speed. */
export class OpenLoopFlywheel {
  readonly plant = new FlywheelPlant();
  t = 0;

  step(commanded: number, sag: boolean, load: boolean): OpenLoopSample {
    this.plant.loadVolts = load ? LOAD_VOLTS : 0;
    const applied = appliedVolts(commanded, sag);
    const sample = {
      t: this.t,
      commanded,
      applied,
      velocity: this.plant.velocityRPS,
      expected: steadyRPS(commanded),
    };
    this.plant.update(applied, LOOP_PERIOD);
    this.t += LOOP_PERIOD;
    return sample;
  }
}
