import { PIDController } from './PIDController';
import { TrapezoidProfile, type Constraints, type State } from './TrapezoidProfile';

/**
 * Port of WPILib's ProfiledPIDController: a PIDController that chases a trapezoid-profiled setpoint
 * instead of the goal itself. calculate() is meant to be called once per robot loop.
 */
export class ProfiledPIDController {
  private readonly controller: PIDController;
  private profile: TrapezoidProfile;
  private goal: State = { position: 0, velocity: 0 };
  private setpoint: State = { position: 0, velocity: 0 };

  constructor(kp: number, ki: number, kd: number, constraints: Constraints, public readonly period = 0.02) {
    this.controller = new PIDController(kp, ki, kd, period);
    this.profile = new TrapezoidProfile(constraints);
  }

  setPID(kp: number, ki: number, kd: number): void {
    this.controller.setPID(kp, ki, kd);
  }

  setConstraints(constraints: Constraints): void {
    this.profile = new TrapezoidProfile(constraints);
  }

  setTolerance(positionTolerance: number, velocityTolerance = Infinity): void {
    this.controller.setTolerance(positionTolerance, velocityTolerance);
  }

  setGoal(position: number): void {
    this.goal = { position, velocity: 0 };
  }

  getGoal(): State {
    return this.goal;
  }

  /** The profiled setpoint: where the plan says the mechanism should be right now. */
  getSetpoint(): State {
    return this.setpoint;
  }

  /** Setpoint minus measurement (not goal minus measurement). */
  getPositionError(): number {
    return this.controller.getError();
  }

  atSetpoint(): boolean {
    return this.controller.atSetpoint();
  }

  atGoal(): boolean {
    return this.atSetpoint() && this.goal.position === this.setpoint.position && this.goal.velocity === this.setpoint.velocity;
  }

  /** Advances the profile one period, then returns the PID output toward the new setpoint. */
  calculate(measurement: number, goal?: number): number {
    if (goal !== undefined) this.setGoal(goal);
    this.setpoint = this.profile.calculate(this.period, this.setpoint, this.goal);
    return this.controller.calculate(measurement, this.setpoint.position);
  }

  /** Restarts the profile from the mechanism's real position and velocity. */
  reset(measuredPosition: number, measuredVelocity = 0): void {
    this.controller.reset();
    this.setpoint = { position: measuredPosition, velocity: measuredVelocity };
  }
}
