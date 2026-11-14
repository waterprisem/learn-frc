import type { FlywheelGains, Schedule } from './flywheelSim';

/** Named gain sets. "tuned" is the Lab 4 solution; the others are the lab's deliberate experiments. */
export const flywheelPresets = {
  zero: { label: 'All zeros (start of the lab)', gains: { kP: 0, kI: 0, kD: 0, kS: 0, kV: 0 } },
  tuned: { label: 'Tuned (lab solution)', gains: { kP: 0.08, kI: 0, kD: 0, kS: 0.2, kV: 0.12 } },
  'kv-low': { label: 'kV too small', gains: { kP: 0.08, kI: 0, kD: 0, kS: 0.2, kV: 0.06 } },
  'kv-high': { label: 'kV too large', gains: { kP: 0.08, kI: 0, kD: 0, kS: 0.2, kV: 0.16 } },
  'kp-high': { label: 'kP too large', gains: { kP: 2.5, kI: 0, kD: 0, kS: 0.2, kV: 0.12 } },
  'no-feedback': { label: 'No feedback (kP = 0)', gains: { kP: 0, kI: 0, kD: 0, kS: 0.2, kV: 0.12 } },
  'p-only': { label: 'No feedforward (kP only)', gains: { kP: 0.08, kI: 0, kD: 0, kS: 0, kV: 0 } },
} satisfies Record<string, { label: string; gains: FlywheelGains }>;

export type FlywheelPresetId = keyof typeof flywheelPresets;

/** The standard test used for practice graphs: hold 40 RPS from 0.5 s. */
export const standardSchedule: Schedule = [
  { at: 0, target: null },
  { at: 0.5, target: 40 },
];
export const STANDARD_SECONDS = 4;
