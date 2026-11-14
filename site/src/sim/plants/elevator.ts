/**
 * Elevator driven by one Kraken X60, matching the Lab 6 simulation (WPILib ElevatorSim with
 * gearing 10, a 5 kg carriage, a 0.022 m drum, gravity on, hard stops at 0 and 1.20 m).
 * Height is in meters and velocity in meters per second.
 */
const KRAKEN = { nominalVolts: 12, stallTorque: 7.09, stallCurrent: 366, freeCurrent: 2, freeSpeedRadPerSec: (6000 * 2 * Math.PI) / 60 };
const GRAVITY = 9.8;

export interface ElevatorOptions {
  gearing?: number;
  carriageMassKg?: number;
  drumRadiusMeters?: number;
  minHeightMeters?: number;
  maxHeightMeters?: number;
  startHeightMeters?: number;
}

export class ElevatorPlant {
  heightMeters: number;
  velocityMetersPerSecond = 0;
  readonly minHeightMeters: number;
  readonly maxHeightMeters: number;
  /** Steady-state speed gained per volt (m/s per V). Its inverse is the "true" kV. */
  readonly metersPerSecondPerVolt: number;
  /** Volts that exactly hold the carriage against gravity: the "true" kG. */
  readonly gravityVolts: number;
  private readonly ratePerSec: number;

  constructor(opts: ElevatorOptions = {}) {
    const { gearing = 10, carriageMassKg = 5, drumRadiusMeters = 0.022, minHeightMeters = 0, maxHeightMeters = 1.2, startHeightMeters = 0.02 } = opts;
    const R = KRAKEN.nominalVolts / KRAKEN.stallCurrent;
    const kt = KRAKEN.stallTorque / KRAKEN.stallCurrent;
    const kvRadPerSecPerVolt = KRAKEN.freeSpeedRadPerSec / (KRAKEN.nominalVolts - R * KRAKEN.freeCurrent);
    // LinearSystemId.createElevatorSystem: dv/dt = -ratePerSec·v + accelPerVolt·volts − g
    this.ratePerSec = (gearing * gearing * kt) / (R * drumRadiusMeters * drumRadiusMeters * carriageMassKg * kvRadPerSecPerVolt);
    const accelPerVolt = (gearing * kt) / (R * drumRadiusMeters * carriageMassKg);
    this.metersPerSecondPerVolt = accelPerVolt / this.ratePerSec;
    this.gravityVolts = GRAVITY / accelPerVolt;
    this.minHeightMeters = minHeightMeters;
    this.maxHeightMeters = maxHeightMeters;
    this.heightMeters = startHeightMeters;
  }

  /** Advance the physics by dt seconds with a constant motor voltage. */
  update(volts: number, dt: number): void {
    const settled = (volts - this.gravityVolts) * this.metersPerSecondPerVolt;
    const decay = Math.exp(-this.ratePerSec * dt);
    const before = this.velocityMetersPerSecond;
    this.velocityMetersPerSecond = settled + (before - settled) * decay;
    this.heightMeters += settled * dt + ((before - settled) * (1 - decay)) / this.ratePerSec;
    // Hard stops: the carriage rests on the bottom or against the top.
    if (this.heightMeters <= this.minHeightMeters) {
      this.heightMeters = this.minHeightMeters;
      this.velocityMetersPerSecond = 0;
    } else if (this.heightMeters >= this.maxHeightMeters) {
      this.heightMeters = this.maxHeightMeters;
      this.velocityMetersPerSecond = 0;
    }
  }
}
