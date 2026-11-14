/** One Kraken X60 at 12 V, the motor used across the labs (see plants/flywheel.ts). */
export const MOTOR = { freeSpeedRPS: 100, stallTorqueNm: 7.09 };

export interface GearStage {
  driverTeeth: number; // on the motor side
  drivenTeeth: number; // on the mechanism side
}

/** Motor rotations per mechanism rotation. Above 1 is a reduction. */
export function gearRatio({ driverTeeth, drivenTeeth }: GearStage): number {
  return drivenTeeth / driverTeeth;
}

export interface GearResult {
  ratio: number;
  speedRPS: number; // mechanism speed with the motor at free speed
  torqueNm: number; // mechanism torque with the motor at stall, before losses
  kind: 'reduction' | 'direct' | 'overdrive';
}

export function gearResult(stage: GearStage): GearResult {
  const ratio = gearRatio(stage);
  const kind = Math.abs(ratio - 1) < 1e-9 ? 'direct' : ratio > 1 ? 'reduction' : 'overdrive';
  return { ratio, speedRPS: MOTOR.freeSpeedRPS / ratio, torqueNm: MOTOR.stallTorqueNm * ratio, kind };
}
