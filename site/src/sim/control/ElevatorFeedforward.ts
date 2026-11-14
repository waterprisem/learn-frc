/** Port of WPILib's ElevatorFeedforward: kS·sign(v) + kG + kV·v + kA·a. */
export class ElevatorFeedforward {
  constructor(
    public ks: number,
    public kg: number,
    public kv: number,
    public ka = 0,
  ) {}

  calculate(velocity: number, acceleration = 0): number {
    return this.ks * Math.sign(velocity) + this.kg + this.kv * velocity + this.ka * acceleration;
  }
}
