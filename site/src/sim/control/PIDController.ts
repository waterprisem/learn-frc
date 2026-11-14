/**
 * Port of WPILib's PIDController (edu.wpi.first.math.controller), same equations and method names.
 * calculate(measurement, setpoint) is meant to be called once per robot loop (every `period` seconds).
 */
export class PIDController {
  private positionError = 0;
  private velocityError = 0;
  private prevError = 0;
  private totalError = 0;
  private setpoint = 0;
  private positionTolerance = 0.05;
  private velocityTolerance = Infinity;
  private minimumIntegral = -1;
  private maximumIntegral = 1;
  private haveMeasurement = false;
  private haveSetpoint = false;

  constructor(
    public kp: number,
    public ki: number,
    public kd: number,
    public readonly period = 0.02,
  ) {}

  setPID(kp: number, ki: number, kd: number): void {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
  }

  setTolerance(positionTolerance: number, velocityTolerance = Infinity): void {
    this.positionTolerance = positionTolerance;
    this.velocityTolerance = velocityTolerance;
  }

  setIntegratorRange(minimumIntegral: number, maximumIntegral: number): void {
    this.minimumIntegral = minimumIntegral;
    this.maximumIntegral = maximumIntegral;
  }

  getSetpoint(): number {
    return this.setpoint;
  }

  /** Setpoint minus measurement from the most recent calculate() call. */
  getError(): number {
    return this.positionError;
  }

  atSetpoint(): boolean {
    return (
      this.haveMeasurement &&
      this.haveSetpoint &&
      Math.abs(this.positionError) < this.positionTolerance &&
      Math.abs(this.velocityError) < this.velocityTolerance
    );
  }

  calculate(measurement: number, setpoint: number): number {
    this.setpoint = setpoint;
    this.haveSetpoint = true;
    this.haveMeasurement = true;
    this.prevError = this.positionError;
    this.positionError = setpoint - measurement;
    this.velocityError = (this.positionError - this.prevError) / this.period;
    if (this.ki !== 0) {
      this.totalError = Math.min(
        Math.max(this.totalError + this.positionError * this.period, this.minimumIntegral / this.ki),
        this.maximumIntegral / this.ki,
      );
    }
    return this.kp * this.positionError + this.ki * this.totalError + this.kd * this.velocityError;
  }

  /** Clears error history. A stale atSetpoint() stays false until the next calculate(). */
  reset(): void {
    this.positionError = 0;
    this.prevError = 0;
    this.totalError = 0;
    this.velocityError = 0;
    this.haveMeasurement = false;
  }
}
