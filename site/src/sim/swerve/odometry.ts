import { wrapDegrees, type ChassisSpeeds } from './kinematics';
import { LOOP_PERIOD, SwerveSim, type Pose } from './swerveSim';

/** A small seeded random generator (mulberry32), so a run with the same seed repeats exactly. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DriftConfig {
  seed: number;
  /** Wheel slip: the encoders over-read distance by about this fraction (0.05 = 5%); each leg of the loop gets a random share up to twice this. */
  slip: number;
  /** Gyro drift in degrees per second. */
  gyroDrift: number;
  /** Fraction of the time the vision correction is on. Off means odometry only. */
  vision: boolean;
  /** Reject measurements with more ambiguity than this. The team's OrbitCamera uses 0.2. */
  ambiguityThreshold: number;
}

/** The team's OrbitCamera ignores a single tag farther than this. */
export const MAX_TAG_DISTANCE = 4;
export const TAG = { x: 3, y: 5.2 };
export const VISION_PERIOD = 0.5;
const SPEED = 1.5;
const SPIN = (2 * Math.PI) / 9; // one turn per lap, rad/s
export const CORNERS = [
  { x: 1.5, y: 1.5 },
  { x: 4.5, y: 1.5 },
  { x: 4.5, y: 4.5 },
  { x: 1.5, y: 4.5 },
];

export interface VisionEvent {
  measured: { x: number; y: number };
  ambiguity: number;
  distance: number;
  accepted: boolean;
  errorBefore: number;
  errorAfter: number;
}

export interface DriftSample {
  t: number;
  truth: Pose;
  estimate: Pose;
  /** Distance between the estimated and the true position, in meters. */
  error: number;
  event?: VisionEvent;
}

/**
 * The robot drives a square loop while turning. Odometry integrates the wheel distance and the
 * gyro heading, with the error sources of lesson 6.5. Optionally a pose estimator blends in a tag
 * measurement every half second, as in lesson 7.2.
 */
export class DriftRun {
  readonly sim = new SwerveSim();
  private readonly rng: () => number;
  private estimate: Pose;
  private headingOffset = 0;
  private corner = 1;
  /** Each leg of the loop slips by a different amount, so the errors do not cancel around the loop. */
  private legFactor: number;
  private sinceVision = 0;
  t = 0;

  constructor(readonly config: DriftConfig) {
    this.rng = seededRandom(config.seed);
    this.sim.pose = { x: CORNERS[0].x, y: CORNERS[0].y, heading: 0 };
    this.estimate = { ...this.sim.pose };
    this.legFactor = 2 * this.rng();
  }

  private gauss(): number {
    return Math.sqrt(-2 * Math.log(1 - this.rng())) * Math.cos(2 * Math.PI * this.rng());
  }

  private command(): ChassisSpeeds {
    const p = this.sim.pose;
    let target = CORNERS[this.corner];
    if (Math.hypot(target.x - p.x, target.y - p.y) < SPEED * LOOP_PERIOD) {
      this.corner = (this.corner + 1) % CORNERS.length;
      this.legFactor = 2 * this.rng();
      target = CORNERS[this.corner];
    }
    const d = Math.hypot(target.x - p.x, target.y - p.y) || 1;
    const fx = ((target.x - p.x) / d) * SPEED;
    const fy = ((target.y - p.y) / d) * SPEED;
    const h = (p.heading * Math.PI) / 180;
    return { vx: fx * Math.cos(h) + fy * Math.sin(h), vy: -fx * Math.sin(h) + fy * Math.cos(h), omega: SPIN };
  }

  step(): DriftSample {
    const before = { ...this.sim.pose };
    this.sim.step(this.command());
    const after = this.sim.pose;

    // Odometry: the true movement, over-read by slip, turned by a gyro heading that has drifted.
    const slipScale = 1 + this.config.slip * this.legFactor;
    const dxField = (after.x - before.x) * slipScale;
    const dyField = (after.y - before.y) * slipScale;
    // The true movement is in the field frame; re-express it in the robot frame, then rotate by the gyro heading.
    const th = (before.heading * Math.PI) / 180;
    const rx = dxField * Math.cos(th) + dyField * Math.sin(th);
    const ry = -dxField * Math.sin(th) + dyField * Math.cos(th);
    this.t += LOOP_PERIOD;
    const gyro = after.heading + this.config.gyroDrift * this.t;
    const mid = (((before.heading + this.config.gyroDrift * (this.t - LOOP_PERIOD)) + this.headingOffset) * Math.PI) / 180;
    this.estimate = {
      x: this.estimate.x + rx * Math.cos(mid) - ry * Math.sin(mid),
      y: this.estimate.y + rx * Math.sin(mid) + ry * Math.cos(mid),
      heading: gyro + this.headingOffset,
    };

    let event: VisionEvent | undefined;
    this.sinceVision += LOOP_PERIOD;
    if (this.config.vision && this.sinceVision >= VISION_PERIOD - 1e-9) {
      this.sinceVision = 0;
      event = this.vision();
    }
    return { t: this.t, truth: { ...after }, estimate: { ...this.estimate }, error: this.error(), event };
  }

  private error(): number {
    return Math.hypot(this.estimate.x - this.sim.pose.x, this.estimate.y - this.sim.pose.y);
  }

  /** One single-tag measurement. Distance adds noise; ambiguity adds a jump to a mirror-like wrong answer. */
  private vision(): VisionEvent {
    const truth = this.sim.pose;
    const distance = Math.hypot(TAG.x - truth.x, TAG.y - truth.y);
    const ambiguity = this.rng() ** 3;
    const std = 0.05 + 0.02 * distance * distance;
    const jump = 0.8 * ambiguity;
    const dir = this.rng() * 2 * Math.PI;
    const measured = {
      x: truth.x + this.gauss() * std * 0.5 + jump * Math.cos(dir),
      y: truth.y + this.gauss() * std * 0.5 + jump * Math.sin(dir),
    };
    const headingMeasured = truth.heading + this.gauss() * 1;
    const errorBefore = this.error();
    const accepted = ambiguity <= this.config.ambiguityThreshold && distance <= MAX_TAG_DISTANCE;
    if (accepted) {
      // A Kalman-style weight: the smaller the standard deviation, the harder the pose is pulled.
      const q = 0.3 * 0.3;
      const gain = q / (q + std * std);
      this.estimate.x += gain * (measured.x - this.estimate.x);
      this.estimate.y += gain * (measured.y - this.estimate.y);
      this.headingOffset += gain * wrapDegrees(headingMeasured - this.estimate.heading);
      this.estimate.heading = wrapDegrees(this.estimate.heading) + gain * wrapDegrees(headingMeasured - this.estimate.heading);
    }
    return { measured, ambiguity, distance, accepted, errorBefore, errorAfter: this.error() };
  }
}

/** Run a whole scenario and return every sample. */
export function runDrift(config: DriftConfig, seconds: number): DriftSample[] {
  const run = new DriftRun(config);
  const out: DriftSample[] = [];
  for (let i = 0; i < Math.round(seconds / LOOP_PERIOD); i++) out.push(run.step());
  return out;
}
