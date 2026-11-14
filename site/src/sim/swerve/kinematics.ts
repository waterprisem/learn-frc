/**
 * Swerve kinematics as in WPILib SwerveDriveKinematics, for the team's square chassis.
 * Robot frame: x forward, y left, angles counter-clockwise from forward, in degrees.
 */
export interface ChassisSpeeds {
  vx: number; // m/s forward
  vy: number; // m/s left
  omega: number; // rad/s counter-clockwise
}

export interface ModuleState {
  speed: number; // m/s, negative = the wheel runs backward
  angle: number; // degrees in (-180, 180]
}

export const HALF_TRACK_METERS = 0.283;
export const MAX_WHEEL_SPEED = 4.5;
export const moduleNames = ['FL', 'FR', 'BL', 'BR'] as const;
export type ModuleName = (typeof moduleNames)[number];

/** Module positions (x forward, y left) from the robot center. */
export const modulePositions: Record<ModuleName, { x: number; y: number }> = {
  FL: { x: HALF_TRACK_METERS, y: HALF_TRACK_METERS },
  FR: { x: HALF_TRACK_METERS, y: -HALF_TRACK_METERS },
  BL: { x: -HALF_TRACK_METERS, y: HALF_TRACK_METERS },
  BR: { x: -HALF_TRACK_METERS, y: -HALF_TRACK_METERS },
};

export const wrapDegrees = (deg: number): number => {
  let a = ((deg + 180) % 360 + 360) % 360 - 180;
  if (a === -180) a = 180;
  return a;
};

/** Each wheel moves like the robot's translation plus the spin at its corner: v = (vx − ω·y, vy + ω·x). */
export function toModuleStates(c: ChassisSpeeds): Record<ModuleName, ModuleState> {
  const out = {} as Record<ModuleName, ModuleState>;
  for (const n of moduleNames) {
    const { x, y } = modulePositions[n];
    const wx = c.vx - c.omega * y;
    const wy = c.vy + c.omega * x;
    out[n] = { speed: Math.hypot(wx, wy), angle: Math.hypot(wx, wy) < 1e-9 ? 0 : wrapDegrees((Math.atan2(wy, wx) * 180) / Math.PI) };
  }
  return out;
}

/** If any wheel is asked for more than the limit, scale all of them down together so the direction of travel is kept. */
export function desaturate(states: Record<ModuleName, ModuleState>, max = MAX_WHEEL_SPEED): Record<ModuleName, ModuleState> {
  const top = Math.max(...moduleNames.map((n) => Math.abs(states[n].speed)));
  if (top <= max) return states;
  const k = max / top;
  return Object.fromEntries(moduleNames.map((n) => [n, { ...states[n], speed: states[n].speed * k }])) as Record<ModuleName, ModuleState>;
}

/** Take the shorter turn: if the wheel is more than 90° from the target, aim 180° away and run backward. */
export function optimize(target: ModuleState, currentAngle: number): ModuleState {
  const delta = wrapDegrees(target.angle - currentAngle);
  if (Math.abs(delta) > 90) return { speed: -target.speed, angle: wrapDegrees(target.angle + 180) };
  return target;
}

/** Inverse of toModuleStates for the whole chassis (least squares): what the robot actually does. */
export function toChassisSpeeds(states: Record<ModuleName, ModuleState>): ChassisSpeeds {
  let vx = 0;
  let vy = 0;
  let omega = 0;
  const k = moduleNames.length;
  const r2 = 2 * HALF_TRACK_METERS * HALF_TRACK_METERS * 4; // Σ(x² + y²)
  for (const n of moduleNames) {
    const { x, y } = modulePositions[n];
    const a = (states[n].angle * Math.PI) / 180;
    const wx = states[n].speed * Math.cos(a);
    const wy = states[n].speed * Math.sin(a);
    vx += wx / k;
    vy += wy / k;
    omega += (x * wy - y * wx) / r2;
  }
  return { vx, vy, omega };
}
