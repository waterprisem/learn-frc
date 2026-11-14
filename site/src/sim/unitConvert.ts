export type Mechanism = 'arm' | 'elevator';
export type Direction = 'toMechanism' | 'toMotor';

export interface ConvertInput {
  mechanism: Mechanism;
  direction: Direction;
  value: number; // motor rotations, or degrees / meters, depending on direction
  gearRatio: number; // motor rotations per mechanism rotation
  radiusMeters: number; // drum radius, elevator only
}

export interface ConvertStep {
  label: string;
  value: number;
  unit: string;
}

export const circumference = (radiusMeters: number) => 2 * Math.PI * radiusMeters;

/** Mechanism units per mechanism rotation: 360 degrees for an arm, one drum circumference for an elevator. */
export function unitsPerRotation(mechanism: Mechanism, radiusMeters: number): number {
  return mechanism === 'arm' ? 360 : circumference(radiusMeters);
}

export function mechanismUnit(mechanism: Mechanism): string {
  return mechanism === 'arm' ? 'degrees' : 'meters';
}

/**
 * The conversion chain from the lesson, one step per line.
 * Motor to mechanism: ÷ ratio, then × units per rotation. Mechanism to motor: the same steps backwards.
 */
export function convert(input: ConvertInput): { steps: ConvertStep[]; result: number; unit: string } {
  const { mechanism, direction, value, gearRatio, radiusMeters } = input;
  const per = unitsPerRotation(mechanism, radiusMeters);
  const unit = mechanismUnit(mechanism);
  if (direction === 'toMechanism') {
    const mechRot = value / gearRatio;
    const result = mechRot * per;
    return {
      steps: [
        { label: 'Motor rotations', value, unit: 'rotations' },
        { label: 'Mechanism rotations', value: mechRot, unit: 'rotations' },
        { label: mechanism === 'arm' ? 'Arm angle' : 'Height', value: result, unit },
      ],
      result,
      unit,
    };
  }
  const mechRot = value / per;
  const result = mechRot * gearRatio;
  return {
    steps: [
      { label: mechanism === 'arm' ? 'Arm angle' : 'Height', value, unit },
      { label: 'Mechanism rotations', value: mechRot, unit: 'rotations' },
      { label: 'Motor rotations', value: result, unit: 'rotations' },
    ],
    result,
    unit: 'rotations',
  };
}
