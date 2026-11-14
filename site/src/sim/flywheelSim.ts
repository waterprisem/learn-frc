import { PIDController } from './control/PIDController';
import { SimpleMotorFeedforward } from './control/SimpleMotorFeedforward';
import { FlywheelPlant } from './plants/flywheel';

/** Seconds per robot loop. WPILib's TimedRobot default. */
export const LOOP_PERIOD = 0.02;
export const BATTERY_VOLTS = 12;

/** Gains named after the Lab 4 constants: PID_KP…, FEEDFORWARD_KS_VOLTS, FEEDFORWARD_KV_VOLTS_PER_RPS. */
export interface FlywheelGains {
  kP: number;
  kI: number;
  kD: number;
  kS: number;
  kV: number;
}

/** One robot loop of telemetry. Fields match the lab's NetworkTables topics. */
export interface FlywheelSample {
  t: number;
  target: number; // "Target RPS"
  velocity: number; // "Velocity RPS"
  error: number; // "Error RPS"
  output: number; // "Output Voltage"
  atTarget: boolean; // "At Target"
}

export const VELOCITY_TOLERANCE_RPS = 2;

/**
 * FlywheelSubsystem + SetFlywheelVelocityCommand + the physics, stepped one robot loop at a time.
 * `target = null` means no button is held: the command has ended and the motor gets 0 V.
 */
export class FlywheelSim {
  readonly plant: FlywheelPlant;
  private readonly pid: PIDController;
  private readonly ff: SimpleMotorFeedforward;
  private activeTarget: number | null = null;
  private lastMeasurement = 0;
  t = 0;

  constructor(gains: FlywheelGains, loadVolts = 0) {
    this.plant = new FlywheelPlant({ loadVolts });
    this.pid = new PIDController(gains.kP, gains.kI, gains.kD, LOOP_PERIOD);
    this.pid.setTolerance(VELOCITY_TOLERANCE_RPS);
    this.ff = new SimpleMotorFeedforward(gains.kS, gains.kV);
  }

  setGains(g: FlywheelGains): void {
    this.pid.setPID(g.kP, g.kI, g.kD);
    this.ff.ks = g.kS;
    this.ff.kv = g.kV;
  }

  step(target: number | null): FlywheelSample {
    // The encoder value the code sees is one loop old, as it is over CAN on a real robot.
    const measurement = this.lastMeasurement;
    this.lastMeasurement = this.plant.velocityRPS;

    let output = 0; // end(): setFlywheelVoltage(0.0)
    if (target !== null) {
      if (target !== this.activeTarget) this.pid.reset(); // a new command runs initialize()
      // execute(): closedLoopCalculate(targetRPS)
      output = this.pid.calculate(measurement, target) + this.ff.calculate(target);
      output = Math.min(Math.max(output, -BATTERY_VOLTS), BATTERY_VOLTS);
    }
    this.activeTarget = target;

    const sample: FlywheelSample = {
      t: this.t,
      target: this.pid.getSetpoint(),
      velocity: measurement,
      error: this.pid.getError(),
      output,
      atTarget: this.pid.atSetpoint(),
    };
    this.plant.update(output, LOOP_PERIOD);
    this.t += LOOP_PERIOD;
    return sample;
  }
}

/** A scripted run: hold `target` from each `at` time until the next entry (null = released). */
export type Schedule = Array<{ at: number; target: number | null }>;

export function runScenario(gains: FlywheelGains, schedule: Schedule, seconds: number, loadVolts = 0): FlywheelSample[] {
  const sim = new FlywheelSim(gains, loadVolts);
  const samples: FlywheelSample[] = [];
  const steps = Math.round(seconds / LOOP_PERIOD);
  for (let i = 0; i < steps; i++) {
    const now = i * LOOP_PERIOD;
    let target: number | null = null;
    for (const s of schedule) if (now >= s.at - 1e-9) target = s.target;
    samples.push(sim.step(target));
  }
  return samples;
}
