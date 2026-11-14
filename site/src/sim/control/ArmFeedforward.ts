/** Port of WPILib's ArmFeedforward: kS·sign(v) + kG·cos(angle) + kV·v + kA·a. Angle in radians, 0 = horizontal. */
export class ArmFeedforward {
  constructor(
    public ks: number,
    public kg: number,
    public kv: number,
    public ka = 0,
  ) {}

  calculate(positionRadians: number, velocityRadPerSec: number, accelerationRadPerSecSq = 0): number {
    return this.ks * Math.sign(velocityRadPerSec) + this.kg * Math.cos(positionRadians) + this.kv * velocityRadPerSec + this.ka * accelerationRadPerSecSq;
  }
}
