import type { ArmGains, ArmSchedule } from './armSim';

const lab: ArmGains = { kP: 0.22, kI: 0, kD: 0.018, maxVelocity: 120, maxAcceleration: 240, kS: 0.1, kG: 0.16, kV: 1.25, kA: 0.08 };

/** Named gain sets. "lab" is the Lab 7 solution; the others are the lab's experiments. */
export const armPresets = {
  lab: { label: 'Lab solution', gains: lab },
  'kg-zero': { label: 'kG = 0', gains: { ...lab, kG: 0 } },
  slow: { label: 'Max velocity 50', gains: { ...lab, maxVelocity: 50 } },
  'p-only': { label: 'No feedforward (PID only)', gains: { ...lab, kS: 0, kG: 0, kV: 0, kA: 0 } },
  'kp-high': { label: 'kP far too large', gains: { ...lab, kP: 3 } },
} satisfies Record<string, { label: string; gains: ArmGains }>;

export type ArmPresetId = keyof typeof armPresets;

/** The standard test: hold home, then level 3 (Xbox Y, 95°) from 0.5 s. */
export const standardArmSchedule: ArmSchedule = [{ at: 0.5, target: 95 }];
export const STANDARD_ARM_SECONDS = 5;
