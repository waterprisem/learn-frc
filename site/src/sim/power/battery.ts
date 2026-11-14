/**
 * Battery voltage sag and roboRIO brownout protection.
 * The battery is a voltage source with internal resistance: volts = resting volts − amps × ohms.
 */

export interface Battery {
  restVolts: number;
  internalOhms: number;
}

export const batteries = {
  fresh: { restVolts: 12.7, internalOhms: 0.015 },
  tired: { restVolts: 12.2, internalOhms: 0.025 },
} satisfies Record<string, Battery>;
export type BatteryId = keyof typeof batteries;

/** roboRIO 2 disables motor outputs below this voltage (the original roboRIO uses 6.3 V). */
export const BROWNOUT_VOLTS = 6.75;
/** Outputs come back once the voltage has recovered past this. */
export const RECOVER_VOLTS = 7.5;
/** The roboRIO, radio and other electronics. */
export const IDLE_AMPS = 5;
export const LOOP_PERIOD = 0.02;

/** How quickly motor current follows demand, in seconds. */
const CURRENT_LAG = 0.08;

export function terminalVolts(battery: Battery, amps: number): number {
  return battery.restVolts - amps * battery.internalOhms;
}

/** Battery voltage once the current has settled, if nothing cut the motors off. */
export function settledVolts(battery: Battery, motors: number, limitAmps: number): number {
  return terminalVolts(battery, IDLE_AMPS + motors * limitAmps);
}

export interface PowerSample {
  [key: string]: number | boolean;
  t: number;
  volts: number;
  amps: number;
  threshold: number;
  brownout: boolean;
}

export interface PowerInput {
  battery: Battery;
  /** Motors pushing against something that will not move. Each one draws up to its current limit. */
  motors: number;
  limitAmps: number;
  pushing: boolean;
}

/** One 20 ms step at a time, like the robot loop. */
export class PowerSim {
  t = 0;
  motorAmps = 0;
  brownout = false;

  step({ battery, motors, limitAmps, pushing }: PowerInput): PowerSample {
    const demand = pushing && !this.brownout ? motors * limitAmps : 0;
    this.motorAmps += (demand - this.motorAmps) * (LOOP_PERIOD / CURRENT_LAG);
    const amps = IDLE_AMPS + this.motorAmps;
    const volts = terminalVolts(battery, amps);
    if (volts < BROWNOUT_VOLTS) this.brownout = true;
    else if (volts > RECOVER_VOLTS && this.motorAmps < 1) this.brownout = false;
    this.t += LOOP_PERIOD;
    return { t: this.t, volts, amps, threshold: BROWNOUT_VOLTS, brownout: this.brownout };
  }
}
