/**
 * Lab 10 safety logic for an arm on an elevator: pick which mover goes first, and refuse the faux intake
 * when the pivot is too low. Constants are the Lab 10 ones. Motion is simple rate-limited moves, not full physics.
 */
export const SAFE_ARM_MIN = -25;
export const SAFE_ARM_MAX = 50;
export const CLEARANCE_HEIGHT = 0.64;
export const HOME_ARM = 45;
export const DOWNWARD_ARM = -90;
export const MAX_ELEVATOR = 1.2;

export interface Pose {
  label: string;
  height: number;
  arm: number;
}

export const poses = {
  HOME: { label: 'Home', height: 0.1, arm: 45 },
  INTAKE: { label: 'Intake', height: 0, arm: -22 },
  L1: { label: 'L1', height: 0.18, arm: -8 },
  L2: { label: 'L2', height: 0.42, arm: -10 },
  L3: { label: 'L3', height: 0.7, arm: 48 },
  L4: { label: 'L4', height: 1.08, arm: -20 },
} satisfies Record<string, Pose>;
export type PoseId = keyof typeof poses;

export const outsideEnvelope = (arm: number): boolean => arm < SAFE_ARM_MIN || arm > SAFE_ARM_MAX;

export type Transition = 'ARM_FIRST' | 'ELEVATOR_FIRST' | 'PARALLEL' | 'BLOCKED' | 'IDLE' | 'FAUX_INTAKE';

/** One stage moves the named mechanisms together; the next stage starts when all of them arrive. */
export interface Stage {
  height?: number;
  arm?: number;
}

export interface Plan {
  transition: Transition;
  stages: Stage[];
}

/** safeGoToLevel: the current arm angle picks the branch, then the target arm angle. */
export function planSafeMove(currentArm: number, target: Pose): Plan {
  if (outsideEnvelope(currentArm)) {
    return { transition: 'ARM_FIRST', stages: [{ arm: HOME_ARM }, { height: target.height }, { arm: target.arm }] };
  }
  if (outsideEnvelope(target.arm)) {
    return { transition: 'ELEVATOR_FIRST', stages: [{ height: target.height }, { arm: target.arm }] };
  }
  return { transition: 'PARALLEL', stages: [{ height: target.height, arm: target.arm }] };
}

/** The raw Commands.parallel with no safety rule. */
export function planRaw(target: Pose): Plan {
  return { transition: 'PARALLEL', stages: [{ height: target.height, arm: target.arm }] };
}

/** Right trigger: refuse below the clearance line, otherwise arm down, dip to the line, return, hold. */
export function planFauxIntake(currentHeight: number): Plan {
  if (currentHeight < CLEARANCE_HEIGHT) return { transition: 'BLOCKED', stages: [] };
  return {
    transition: 'FAUX_INTAKE',
    stages: [{ arm: DOWNWARD_ARM }, { height: CLEARANCE_HEIGHT }, { height: currentHeight }],
  };
}

export const ELEVATOR_SPEED = 0.7; // m/s
export const ARM_SPEED = 120; // deg/s

/** Runs a plan stage by stage at fixed mover speeds. `moving` tells whether the carriage is moving this step. */
export class Superstructure {
  height = poses.HOME.height;
  arm = poses.HOME.arm;
  transition: Transition = 'IDLE';
  elevatorMoving = false;
  private stages: Stage[] = [];

  start(plan: Plan): void {
    this.transition = plan.transition;
    this.stages = plan.stages.map((s) => ({ ...s }));
  }

  /** The carriage moves below the clearance line with the arm out of its folded range: what the safety rule prevents. */
  get collisionRisk(): boolean {
    return this.elevatorMoving && outsideEnvelope(this.arm) && this.height < CLEARANCE_HEIGHT - 1e-6;
  }

  step(dt: number): void {
    this.elevatorMoving = false;
    const stage = this.stages[0];
    if (!stage) {
      if (this.transition !== 'BLOCKED') this.transition = 'IDLE';
      return;
    }
    let done = true;
    if (stage.height !== undefined) {
      const d = stage.height - this.height;
      const move = Math.min(Math.abs(d), ELEVATOR_SPEED * dt);
      if (move > 1e-9) this.elevatorMoving = true;
      this.height += Math.sign(d) * move;
      if (Math.abs(stage.height - this.height) > 1e-6) done = false;
    }
    if (stage.arm !== undefined) {
      const d = stage.arm - this.arm;
      this.arm += Math.sign(d) * Math.min(Math.abs(d), ARM_SPEED * dt);
      if (Math.abs(stage.arm - this.arm) > 1e-6) done = false;
    }
    if (done) this.stages.shift();
  }
}
