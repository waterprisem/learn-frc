import { ElevatorFeedforward } from './control/ElevatorFeedforward';
import { ProfiledPIDController } from './control/ProfiledPIDController';
import { ElevatorPlant } from './plants/elevator';
import { BATTERY_VOLTS, LOOP_PERIOD } from './flywheelSim';

export { LOOP_PERIOD };

/** Gains named after the Lab 6 constants: PID_KP…, MAX_VELOCITY…, FEEDFORWARD_KS_VOLTS… */
export interface ElevatorGains {
  kP: number;
  kI: number;
  kD: number;
  maxVelocity: number;
  maxAcceleration: number;
  kS: number;
  kG: number;
  kV: number;
  kA: number;
}

/** One robot loop of telemetry. Fields match the lab's NetworkTables topics. */
export interface ElevatorSample {
  t: number;
  goal: number; // "Target Meters"
  setpoint: number; // "Profiled Setpoint Meters"
  setpointVelocity: number;
  height: number; // "Height Meters"
  error: number; // "Error Meters" (setpoint minus height)
  output: number; // "Output Voltage"
  atTarget: boolean; // "At Target"
}

export const POSITION_TOLERANCE_METERS = 0.025;
export const MIN_HEIGHT_METERS = 0;
export const MAX_HEIGHT_METERS = 1.2;
export const STOW_HEIGHT_METERS = 0.02;

/**
 * ElevatorSubsystem + SetElevatorHeightCommand + the physics, stepped one robot loop at a time.
 * A command is always running (the default command holds stow), so `target` is always a height.
 */
export class ElevatorSim {
  readonly plant = new ElevatorPlant({ minHeightMeters: MIN_HEIGHT_METERS, maxHeightMeters: MAX_HEIGHT_METERS, startHeightMeters: STOW_HEIGHT_METERS });
  private readonly pid: ProfiledPIDController;
  private readonly ff: ElevatorFeedforward;
  private activeTarget: number | null = null;
  private lastHeight = STOW_HEIGHT_METERS;
  private lastVelocity = 0;
  t = 0;

  constructor(gains: ElevatorGains) {
    this.pid = new ProfiledPIDController(gains.kP, gains.kI, gains.kD, { maxVelocity: gains.maxVelocity, maxAcceleration: gains.maxAcceleration }, LOOP_PERIOD);
    this.pid.setTolerance(POSITION_TOLERANCE_METERS);
    this.ff = new ElevatorFeedforward(gains.kS, gains.kG, gains.kV, gains.kA);
  }

  setGains(g: ElevatorGains): void {
    this.pid.setPID(g.kP, g.kI, g.kD);
    this.pid.setConstraints({ maxVelocity: g.maxVelocity, maxAcceleration: g.maxAcceleration });
    this.ff.ks = g.kS;
    this.ff.kg = g.kG;
    this.ff.kv = g.kV;
    this.ff.ka = g.kA;
  }

  step(target: number): ElevatorSample {
    // The encoder values the code sees are one loop old, as they are over CAN on a real robot.
    const height = this.lastHeight;
    const velocity = this.lastVelocity;
    this.lastHeight = this.plant.heightMeters;
    this.lastVelocity = this.plant.velocityMetersPerSecond;

    // A new command runs initialize(): resetProfiledPIDController()
    if (target !== this.activeTarget) this.pid.reset(height, velocity);
    this.activeTarget = target;

    // execute(): closedLoopCalculate(targetHeightMeters)
    const clampedTarget = Math.min(Math.max(target, MIN_HEIGHT_METERS), MAX_HEIGHT_METERS);
    const pidOutput = this.pid.calculate(height, clampedTarget);
    const feedforwardOutput = this.ff.calculate(this.pid.getSetpoint().velocity);
    const output = Math.min(Math.max(pidOutput + feedforwardOutput, -BATTERY_VOLTS), BATTERY_VOLTS);

    const sample: ElevatorSample = {
      t: this.t,
      goal: this.pid.getGoal().position,
      setpoint: this.pid.getSetpoint().position,
      setpointVelocity: this.pid.getSetpoint().velocity,
      height,
      error: this.pid.getPositionError(),
      output,
      atTarget: this.pid.atGoal(),
    };
    this.plant.update(output, LOOP_PERIOD);
    this.t += LOOP_PERIOD;
    return sample;
  }
}

/** A scripted run: hold `target` from each `at` time until the next entry. */
export type ElevatorSchedule = Array<{ at: number; target: number }>;

export function runElevatorScenario(gains: ElevatorGains, schedule: ElevatorSchedule, seconds: number): ElevatorSample[] {
  const sim = new ElevatorSim(gains);
  const samples: ElevatorSample[] = [];
  const steps = Math.round(seconds / LOOP_PERIOD);
  for (let i = 0; i < steps; i++) {
    const now = i * LOOP_PERIOD;
    let target = STOW_HEIGHT_METERS;
    for (const s of schedule) if (now >= s.at - 1e-9) target = s.target;
    samples.push(sim.step(target));
  }
  return samples;
}
