import { ArmFeedforward } from './control/ArmFeedforward';
import { ProfiledPIDController } from './control/ProfiledPIDController';
import { ArmPlant } from './plants/arm';
import { BATTERY_VOLTS, LOOP_PERIOD } from './flywheelSim';

export { LOOP_PERIOD };

const DEG = Math.PI / 180;

/** Gains named after the Lab 7 constants. Angles are degrees; kV and kA are per radian. */
export interface ArmGains {
  kP: number;
  kI: number;
  kD: number;
  maxVelocity: number; // deg/s
  maxAcceleration: number; // deg/s²
  kS: number;
  kG: number;
  kV: number; // V per rad/s
  kA: number; // V per rad/s²
}

/** One robot loop of telemetry, matching the lab's NetworkTables topics. */
export interface ArmSample {
  t: number;
  goal: number; // "Target Degrees"
  setpoint: number; // "Profiled Setpoint Degrees"
  angle: number; // "Angle Degrees"
  error: number; // "Error Degrees"
  output: number; // "Output Voltage"
  /** The gravity part of the feedforward, kG·cos(angle) as the code computed it. */
  gravityVolts: number;
  atTarget: boolean;
}

export const POSITION_TOLERANCE_DEGREES = 2;
export const MIN_ANGLE_DEGREES = -25;
export const MAX_ANGLE_DEGREES = 115;
export const HOME_ANGLE_DEGREES = 0;

/** ArmSubsystem + SetArmAngleCommand + physics, one robot loop at a time. `radiansBug` skips Math.toRadians. */
export class ArmSim {
  readonly plant = new ArmPlant({ startAngleRadians: HOME_ANGLE_DEGREES * DEG });
  radiansBug = false;
  private readonly pid: ProfiledPIDController;
  private readonly ff: ArmFeedforward;
  private activeTarget: number | null = null;
  private lastAngle = HOME_ANGLE_DEGREES;
  private lastVelocity = 0;
  t = 0;

  constructor(gains: ArmGains) {
    this.pid = new ProfiledPIDController(gains.kP, gains.kI, gains.kD, { maxVelocity: gains.maxVelocity, maxAcceleration: gains.maxAcceleration }, LOOP_PERIOD);
    this.pid.setTolerance(POSITION_TOLERANCE_DEGREES);
    this.ff = new ArmFeedforward(gains.kS, gains.kG, gains.kV, gains.kA);
  }

  setGains(g: ArmGains): void {
    this.pid.setPID(g.kP, g.kI, g.kD);
    this.pid.setConstraints({ maxVelocity: g.maxVelocity, maxAcceleration: g.maxAcceleration });
    this.ff.ks = g.kS;
    this.ff.kg = g.kG;
    this.ff.kv = g.kV;
    this.ff.ka = g.kA;
  }

  step(target: number): ArmSample {
    // Encoder values are one loop old, as over CAN on a real robot.
    const angle = this.lastAngle;
    const velocity = this.lastVelocity;
    this.lastAngle = this.plant.angleRadians / DEG;
    this.lastVelocity = this.plant.velocityRadPerSec / DEG;

    if (target !== this.activeTarget) this.pid.reset(angle, velocity);
    this.activeTarget = target;

    const clamped = Math.min(Math.max(target, MIN_ANGLE_DEGREES), MAX_ANGLE_DEGREES);
    const pidOutput = this.pid.calculate(angle, clamped);
    const sp = this.pid.getSetpoint();
    // The Lab 7 line: armFF.calculate(Math.toRadians(position), Math.toRadians(velocity))
    const ffPos = this.radiansBug ? sp.position : sp.position * DEG;
    const ffVel = this.radiansBug ? sp.velocity : sp.velocity * DEG;
    const gravityVolts = this.ff.kg * Math.cos(ffPos);
    const output = Math.min(Math.max(pidOutput + this.ff.calculate(ffPos, ffVel), -BATTERY_VOLTS), BATTERY_VOLTS);

    const sample: ArmSample = {
      t: this.t,
      goal: this.pid.getGoal().position,
      setpoint: sp.position,
      angle,
      error: this.pid.getPositionError(),
      output,
      gravityVolts,
      atTarget: this.pid.atGoal(),
    };
    this.plant.update(output, LOOP_PERIOD);
    this.t += LOOP_PERIOD;
    return sample;
  }
}

/** A scripted run: hold `target` from each `at` time until the next entry. */
export type ArmSchedule = Array<{ at: number; target: number }>;

export function runArmScenario(gains: ArmGains, schedule: ArmSchedule, seconds: number, radiansBug = false): ArmSample[] {
  const sim = new ArmSim(gains);
  sim.radiansBug = radiansBug;
  const samples: ArmSample[] = [];
  const steps = Math.round(seconds / LOOP_PERIOD);
  for (let i = 0; i < steps; i++) {
    const now = i * LOOP_PERIOD;
    let target = HOME_ANGLE_DEGREES;
    for (const s of schedule) if (now >= s.at - 1e-9) target = s.target;
    samples.push(sim.step(target));
  }
  return samples;
}
