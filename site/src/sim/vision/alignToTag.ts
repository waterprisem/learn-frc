import { PIDController } from '../control/PIDController';
import { LOOP_PERIOD } from '../swerve/swerveSim';
import { wrapDegrees } from '../swerve/kinematics';
import type { Pose2 } from './cameraTransform';

export { LOOP_PERIOD };

export interface AlignGains {
  x: number;
  y: number;
  rot: number;
}

/** The plan's limits: 2 cm and 2 degrees to count as aligned, 0.5 s of stale vision at most. */
export const TOLERANCE_METERS = 0.02;
export const TOLERANCE_RADIANS = (2 * Math.PI) / 180;
export const STALE_SECONDS = 0.5;
/** Each PID output is clamped so a large first error does not slam the robot toward a wall. */
export const MAX_SPEED = 2;
export const MAX_OMEGA = 4;
const MAX_ACCEL = 4;
const MAX_ALPHA = 12;

export const TAG_POSE: Pose2 = { x: 3, y: 5.6, heading: -90 };
/** 0.5 m in front of the tag and facing it. */
export const TARGET: Pose2 = { x: 3, y: 5.1, heading: 90 };
export const START: Pose2 = { x: 1.2, y: 2, heading: -30 };

export interface AlignSample {
  t: number;
  pose: Pose2;
  /** Target minus robot, in meters and radians (rotation wrapped to the short way round). */
  errorX: number;
  errorY: number;
  errorRot: number;
  /** The field-centric speeds sent to the drivetrain. */
  vx: number;
  vy: number;
  omega: number;
  aligned: boolean;
  /** True when vision has been stale for too long and the command outputs zero. */
  stopped: boolean;
  /** Seconds since the last tag measurement. */
  visionAge: number;
}

const clamp = (v: number, m: number) => Math.min(m, Math.max(-m, v));
const toward = (cur: number, want: number, step: number) => cur + clamp(want - cur, step);

/**
 * AlignToTag: three PIDs on x, y and rotation, field-centric. The pose comes from the estimator,
 * which here is the true pose. Vision is a flag: with the tag covered the estimator gets no
 * updates, and after 0.5 s the command stops instead of driving on stale data.
 */
export class AlignRun {
  pose: Pose2 = { ...START };
  private v = { x: 0, y: 0, w: 0 };
  private readonly pids: { x: PIDController; y: PIDController; rot: PIDController };
  private lastVision = 0;
  private finished = false;
  t = 0;

  constructor(gains: AlignGains, private readonly target: Pose2 = TARGET) {
    this.pids = {
      x: new PIDController(gains.x, 0, 0, LOOP_PERIOD),
      y: new PIDController(gains.y, 0, 0, LOOP_PERIOD),
      rot: new PIDController(gains.rot, 0, 0, LOOP_PERIOD),
    };
  }

  setGains(g: AlignGains): void {
    this.pids.x.setPID(g.x, 0, 0);
    this.pids.y.setPID(g.y, 0, 0);
    this.pids.rot.setPID(g.rot, 0, 0);
  }

  step(tagVisible: boolean): AlignSample {
    if (tagVisible) this.lastVision = this.t;
    const visionAge = this.t - this.lastVision;
    const stopped = visionAge > STALE_SECONDS;

    const p = this.pose;
    const rotError = (wrapDegrees(this.target.heading - p.heading) * Math.PI) / 180;
    const errorX = this.target.x - p.x;
    const errorY = this.target.y - p.y;
    const aligned = Math.abs(errorX) < TOLERANCE_METERS && Math.abs(errorY) < TOLERANCE_METERS && Math.abs(rotError) < TOLERANCE_RADIANS;
    if (aligned) this.finished = true;

    let want = { x: 0, y: 0, w: 0 };
    if (!stopped && !this.finished) {
      want = {
        x: clamp(this.pids.x.calculate(p.x, this.target.x), MAX_SPEED),
        y: clamp(this.pids.y.calculate(p.y, this.target.y), MAX_SPEED),
        // Measure relative to the target so the error is the short way round (continuous input).
        w: clamp(this.pids.rot.calculate(this.target.heading * Math.PI / 180 - rotError, this.target.heading * Math.PI / 180), MAX_OMEGA),
      };
    }
    const sample: AlignSample = {
      t: this.t, pose: { ...p }, errorX, errorY, errorRot: rotError,
      vx: want.x, vy: want.y, omega: want.w, aligned: this.finished, stopped, visionAge,
    };

    // The drivetrain follows the request with limited acceleration.
    this.v = {
      x: toward(this.v.x, want.x, MAX_ACCEL * LOOP_PERIOD),
      y: toward(this.v.y, want.y, MAX_ACCEL * LOOP_PERIOD),
      w: toward(this.v.w, want.w, MAX_ALPHA * LOOP_PERIOD),
    };
    this.pose = {
      x: p.x + this.v.x * LOOP_PERIOD,
      y: p.y + this.v.y * LOOP_PERIOD,
      heading: p.heading + ((this.v.w * 180) / Math.PI) * LOOP_PERIOD,
    };
    this.t += LOOP_PERIOD;
    return sample;
  }
}

/** Run with the tag visible except in the listed [from, to) windows. */
export function runAlign(gains: AlignGains, seconds: number, covered: Array<[number, number]> = []): AlignSample[] {
  const run = new AlignRun(gains);
  const out: AlignSample[] = [];
  for (let i = 0; i < Math.round(seconds / LOOP_PERIOD); i++) {
    const t = i * LOOP_PERIOD;
    out.push(run.step(!covered.some(([a, b]) => t >= a && t < b)));
  }
  return out;
}
