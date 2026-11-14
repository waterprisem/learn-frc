import { wrapDegrees } from '../swerve/kinematics';

/** A 2D pose: meters and degrees, counter-clockwise, x forward and y left in its own frame. */
export interface Pose2 {
  x: number;
  y: number;
  heading: number;
}

const rad = (d: number) => (d * Math.PI) / 180;

/** `b` is a pose expressed in `a`'s frame; return it in the frame `a` is expressed in. */
export function compose(a: Pose2, b: Pose2): Pose2 {
  const c = Math.cos(rad(a.heading));
  const s = Math.sin(rad(a.heading));
  return { x: a.x + b.x * c - b.y * s, y: a.y + b.x * s + b.y * c, heading: wrapDegrees(a.heading + b.heading) };
}

/** The pose that undoes `a`: compose(a, inverse(a)) is the origin. */
export function inverse(a: Pose2): Pose2 {
  const c = Math.cos(rad(a.heading));
  const s = Math.sin(rad(a.heading));
  return { x: -(a.x * c + a.y * s), y: -(-a.x * s + a.y * c), heading: wrapDegrees(-a.heading) };
}

/** The robot-to-camera transform: where the camera sits on the robot (from its center) and which way it faces. */
export type Mount = Pose2;

export const TAG: Pose2 = { x: 3, y: 5.6, heading: -90 };
/** The mount the simulated robot really has. The playground asks you to enter it. */
export const REAL_MOUNT: Mount = { x: 0.3, y: 0.2, heading: 15 };

/** A slow back-and-forth drive that keeps the tag ahead of the robot, so the camera is always looking at it. */
export function robotAt(t: number): Pose2 {
  return {
    x: 3 + 1.2 * Math.sin(0.5 * t),
    y: 2.4 + 0.5 * Math.sin(0.8 * t),
    heading: 90 + 35 * Math.sin(0.35 * t),
  };
}

/** What the camera reports: the tag's pose in the camera's own frame. */
export function cameraToTag(robot: Pose2, realMount: Mount, tag: Pose2 = TAG): Pose2 {
  return compose(inverse(compose(robot, realMount)), tag);
}

/** PhotonPoseEstimator's chain: tag in the field, minus camera-to-tag, minus robot-to-camera. */
export function estimateRobot(camToTag: Pose2, assumedMount: Mount, tag: Pose2 = TAG): Pose2 {
  const camera = compose(tag, inverse(camToTag));
  return compose(camera, inverse(assumedMount));
}

export interface TransformSample {
  truth: Pose2;
  estimate: Pose2;
  camera: Pose2;
  assumedCamera: Pose2;
  errorX: number;
  errorY: number;
  /** Straight-line distance between the estimated and the true position. */
  error: number;
  headingError: number;
}

export function sampleAt(t: number, assumed: Mount, real: Mount = REAL_MOUNT): TransformSample {
  const truth = robotAt(t);
  const estimate = estimateRobot(cameraToTag(truth, real), assumed);
  const errorX = estimate.x - truth.x;
  const errorY = estimate.y - truth.y;
  return {
    truth,
    estimate,
    camera: compose(truth, real),
    assumedCamera: compose(truth, assumed),
    errorX,
    errorY,
    error: Math.hypot(errorX, errorY),
    headingError: wrapDegrees(estimate.heading - truth.heading),
  };
}
