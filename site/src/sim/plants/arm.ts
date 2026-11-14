/**
 * Arm driven by one Kraken X60, matching the Lab 7 simulation (WPILib SingleJointedArmSim:
 * gearing 100, 0.55 m, 4 kg, gravity on, hard stops at -25° and 115°). Angles are radians, 0 = horizontal.
 */
const KRAKEN = { nominalVolts: 12, stallTorque: 7.09, stallCurrent: 366, freeCurrent: 2, freeSpeedRadPerSec: (6000 * 2 * Math.PI) / 60 };
const GRAVITY = 9.8;
const SUBSTEP = 0.001;

export interface ArmOptions {
  gearing?: number;
  lengthMeters?: number;
  massKg?: number;
  minAngleRadians?: number;
  maxAngleRadians?: number;
  startAngleRadians?: number;
}

export class ArmPlant {
  angleRadians: number;
  velocityRadPerSec = 0;
  readonly minAngleRadians: number;
  readonly maxAngleRadians: number;
  /** Steady-state speed gained per volt (rad/s per V). */
  readonly radPerSecPerVolt: number;
  /** Volts that hold the arm horizontal: the "true" kG. */
  readonly gravityVolts: number;
  private readonly ratePerSec: number;
  private readonly accelPerVolt: number;
  private readonly gravityAccel: number;

  constructor(opts: ArmOptions = {}) {
    const { gearing = 100, lengthMeters = 0.55, massKg = 4, minAngleRadians = (-25 * Math.PI) / 180, maxAngleRadians = (115 * Math.PI) / 180, startAngleRadians = 0 } = opts;
    const R = KRAKEN.nominalVolts / KRAKEN.stallCurrent;
    const kt = KRAKEN.stallTorque / KRAKEN.stallCurrent;
    const kvRadPerSecPerVolt = KRAKEN.freeSpeedRadPerSec / (KRAKEN.nominalVolts - R * KRAKEN.freeCurrent);
    // Rod about one end: J = m·L²/3. LinearSystemId.createSingleJointedArmSystem.
    const inertia = (massKg * lengthMeters * lengthMeters) / 3;
    this.ratePerSec = (gearing * gearing * kt) / (R * kvRadPerSecPerVolt * inertia);
    this.accelPerVolt = (gearing * kt) / (R * inertia);
    this.radPerSecPerVolt = this.accelPerVolt / this.ratePerSec;
    this.gravityAccel = (3 * GRAVITY) / (2 * lengthMeters);
    this.gravityVolts = this.gravityAccel / this.accelPerVolt;
    this.minAngleRadians = minAngleRadians;
    this.maxAngleRadians = maxAngleRadians;
    this.angleRadians = startAngleRadians;
  }

  /** Advance the physics by dt seconds with a constant motor voltage. */
  update(volts: number, dt: number): void {
    const steps = Math.max(1, Math.round(dt / SUBSTEP));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const accel = -this.ratePerSec * this.velocityRadPerSec + this.accelPerVolt * volts - this.gravityAccel * Math.cos(this.angleRadians);
      this.velocityRadPerSec += accel * h;
      this.angleRadians += this.velocityRadPerSec * h;
      if (this.angleRadians <= this.minAngleRadians) {
        this.angleRadians = this.minAngleRadians;
        this.velocityRadPerSec = Math.max(0, this.velocityRadPerSec);
      } else if (this.angleRadians >= this.maxAngleRadians) {
        this.angleRadians = this.maxAngleRadians;
        this.velocityRadPerSec = Math.min(0, this.velocityRadPerSec);
      }
    }
  }
}
