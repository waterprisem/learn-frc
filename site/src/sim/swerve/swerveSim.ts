import { desaturate, moduleNames, optimize, toChassisSpeeds, toModuleStates, type ChassisSpeeds, type ModuleName, type ModuleState } from './kinematics';

export const LOOP_PERIOD = 0.02;
export const FIELD_SIZE_METERS = 6;

export interface Pose {
  x: number; // m
  y: number; // m
  heading: number; // degrees, counter-clockwise
}

/** A swerve drivetrain driven by robot-relative ChassisSpeeds, one 20 ms loop per step. Steering is instant. */
export class SwerveSim {
  pose: Pose = { x: FIELD_SIZE_METERS / 2, y: FIELD_SIZE_METERS / 2, heading: 0 };
  states = Object.fromEntries(moduleNames.map((n) => [n, { speed: 0, angle: 0 }])) as Record<ModuleName, ModuleState>;
  /** What the kinematics asked for, before the shorter-turn flip. */
  requested = this.states;
  actual: ChassisSpeeds = { vx: 0, vy: 0, omega: 0 };

  step(c: ChassisSpeeds): void {
    this.requested = desaturate(toModuleStates(c));
    const next = {} as Record<ModuleName, ModuleState>;
    for (const n of moduleNames) {
      const target = this.requested[n];
      // A stopped wheel keeps its angle instead of snapping to 0.
      next[n] = target.speed < 1e-6 ? { speed: 0, angle: this.states[n].angle } : optimize(target, this.states[n].angle);
    }
    this.states = next;
    this.actual = toChassisSpeeds(next);
    const h = (this.pose.heading * Math.PI) / 180;
    this.pose = {
      x: Math.max(0, Math.min(FIELD_SIZE_METERS, this.pose.x + (this.actual.vx * Math.cos(h) - this.actual.vy * Math.sin(h)) * LOOP_PERIOD)),
      y: Math.max(0, Math.min(FIELD_SIZE_METERS, this.pose.y + (this.actual.vx * Math.sin(h) + this.actual.vy * Math.cos(h)) * LOOP_PERIOD)),
      heading: this.pose.heading + ((this.actual.omega * 180) / Math.PI) * LOOP_PERIOD,
    };
  }
}
