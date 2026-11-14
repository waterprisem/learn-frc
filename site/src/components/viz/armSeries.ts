import type { ChartSeries } from './Chart';

/** Arm signals, named like the lab's NetworkTables topics under /Subsystems/ArmSubsystem/. */
export const armSeries: ChartSeries[] = [
  { key: 'goal', label: 'Target Degrees', unit: '°', cssVar: '--sig-setpoint', dash: '7 5' },
  { key: 'setpoint', label: 'Profiled Setpoint Degrees', unit: '°', cssVar: '--sig-profile', dash: '2 3', width: 2.5 },
  { key: 'angle', label: 'Angle Degrees', unit: '°', cssVar: '--sig-measurement', width: 3 },
  { key: 'output', label: 'Output Voltage', unit: 'V', cssVar: '--sig-output', dash: '2 3', axis: 'right' },
];
export const armBand = { key: 'atTarget', label: 'At Target' };
