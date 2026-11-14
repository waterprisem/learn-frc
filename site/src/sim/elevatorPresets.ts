import type { ElevatorGains, ElevatorSchedule } from './elevatorSim';

const lab: ElevatorGains = { kP: 18, kI: 0, kD: 0.9, maxVelocity: 1.0, maxAcceleration: 1.8, kS: 0.15, kG: 0.55, kV: 1.1, kA: 0.05 };

/** Named gain sets. "lab" is the Lab 6 solution; "kg-zero" and "slow" are the lab's tuning experiments. */
export const elevatorPresets = {
  lab: { label: 'Lab solution', gains: lab },
  zero: { label: 'Gains at zero (start of the lab)', gains: { ...lab, kP: 0, kD: 0, kS: 0, kG: 0, kV: 0, kA: 0 } },
  'kg-zero': { label: 'kG = 0', gains: { ...lab, kG: 0 } },
  slow: { label: 'Max velocity 0.4', gains: { ...lab, maxVelocity: 0.4 } },
  'p-only': { label: 'No feedforward (PID only)', gains: { ...lab, kS: 0, kG: 0, kV: 0, kA: 0 } },
  matched: { label: 'Feedforward matched to this elevator', gains: { ...lab, kS: 0, kG: 0.18, kV: 8.6 } },
  'kp-high': { label: 'kP far too large', gains: { ...lab, kP: 500 } },
} satisfies Record<string, { label: string; gains: ElevatorGains }>;

export type ElevatorPresetId = keyof typeof elevatorPresets;

/** The standard test: hold stow, then the high score height (Xbox Y, 1.05 m) from 0.5 s. */
export const standardElevatorSchedule: ElevatorSchedule = [{ at: 0.5, target: 1.05 }];
export const STANDARD_ELEVATOR_SECONDS = 5;
