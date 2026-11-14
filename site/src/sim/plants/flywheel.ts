/**
 * Flywheel driven by one Kraken X60, matching the Lab 4 simulation (WPILib FlywheelSim with
 * J = 0.004 kg·m², gearing 1) plus a little friction so kS has something to overcome.
 * Velocity is in rotations per second (RPS), like TalonFX.getVelocity().
 */
const KRAKEN = { nominalVolts: 12, stallTorque: 7.09, stallCurrent: 366, freeCurrent: 2, freeSpeedRadPerSec: (6000 * 2 * Math.PI) / 60 };

export interface FlywheelOptions {
  momentOfInertia?: number; // kg·m²
  gearing?: number;
  frictionVolts?: number; // voltage lost to friction whenever the wheel turns
  loadVolts?: number; // extra drag (for example a game piece passing through)
}

export class FlywheelPlant {
  velocityRPS = 0;
  positionRotations = 0;
  loadVolts: number;
  readonly frictionVolts: number;
  /** Steady-state speed gained per volt (RPS/V). Its inverse is the "true" kV. */
  readonly rpsPerVolt: number;
  private readonly ratePerSec: number;

  constructor(opts: FlywheelOptions = {}) {
    const { momentOfInertia = 0.004, gearing = 1, frictionVolts = 0.2, loadVolts = 0 } = opts;
    const R = KRAKEN.nominalVolts / KRAKEN.stallCurrent;
    const kt = KRAKEN.stallTorque / KRAKEN.stallCurrent;
    const kvRadPerSecPerVolt = KRAKEN.freeSpeedRadPerSec / (KRAKEN.nominalVolts - R * KRAKEN.freeCurrent);
    this.ratePerSec = (gearing * gearing * kt) / (kvRadPerSecPerVolt * R * momentOfInertia);
    this.rpsPerVolt = kvRadPerSecPerVolt / gearing / (2 * Math.PI);
    this.frictionVolts = frictionVolts;
    this.loadVolts = loadVolts;
  }

  /** Advance the physics by dt seconds with a constant motor voltage. */
  update(volts: number, dt: number): void {
    const drag = this.frictionVolts + this.loadVolts;
    const direction = this.velocityRPS !== 0 ? Math.sign(this.velocityRPS) : Math.sign(volts);
    if (this.velocityRPS === 0 && Math.abs(volts) <= drag) return; // not enough to break free
    const effective = volts - drag * direction;
    const decay = Math.exp(-this.ratePerSec * dt);
    const before = this.velocityRPS;
    let next = before * decay + effective * this.rpsPerVolt * (1 - decay);
    // Friction can stop the wheel but never push it backwards.
    if (before !== 0 && Math.sign(next) !== Math.sign(before) && Math.abs(volts) <= drag) next = 0;
    this.velocityRPS = next;
    this.positionRotations += ((before + next) / 2) * dt;
  }
}
