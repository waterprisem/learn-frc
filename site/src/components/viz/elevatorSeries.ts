import type { ChartSeries } from './Chart';

/** Elevator signals, named like the lab's NetworkTables topics under /Subsystems/ElevatorSubsystem/. */
export const elevatorSeries: ChartSeries[] = [
  { key: 'goal', label: 'Target Meters', unit: 'm', cssVar: '--sig-setpoint', dash: '7 5' },
  { key: 'setpoint', label: 'Profiled Setpoint Meters', unit: 'm', cssVar: '--sig-profile', dash: '2 3', width: 2.5 },
  { key: 'height', label: 'Height Meters', unit: 'm', cssVar: '--sig-measurement', width: 3 },
  { key: 'output', label: 'Output Voltage', unit: 'V', cssVar: '--sig-output', dash: '2 3', axis: 'right' },
];
export const elevatorBand = { key: 'atTarget', label: 'At Target' };
