import type { ChartSeries } from './Chart';

/** Flywheel signals, named like the lab's NetworkTables topics under /Subsystems/FlywheelSubsystem/. */
export const flywheelSeries: ChartSeries[] = [
  { key: 'target', label: 'Target RPS', unit: 'RPS', cssVar: '--sig-setpoint', dash: '7 5' },
  { key: 'velocity', label: 'Velocity RPS', unit: 'RPS', cssVar: '--sig-measurement', width: 3 },
  { key: 'error', label: 'Error RPS', unit: 'RPS', cssVar: '--sig-error', width: 1.5 },
  { key: 'output', label: 'Output Voltage', unit: 'V', cssVar: '--sig-output', dash: '2 3', axis: 'right' },
];
export const flywheelBand = { key: 'atTarget', label: 'At Target' };
