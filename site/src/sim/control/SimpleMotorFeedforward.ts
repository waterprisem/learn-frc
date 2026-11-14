/** Port of WPILib's SimpleMotorFeedforward for a velocity setpoint: kS·sign(v) + kV·v (+ kA·a). */
export class SimpleMotorFeedforward {
  constructor(
    public ks: number,
    public kv: number,
    public ka = 0,
  ) {}

  calculate(velocity: number, acceleration = 0): number {
    return this.ks * Math.sign(velocity) + this.kv * velocity + this.ka * acceleration;
  }
}
