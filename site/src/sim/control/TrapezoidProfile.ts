/** Port of WPILib's TrapezoidProfile (edu.wpi.first.math.trajectory), same equations and names. */
export interface Constraints {
  maxVelocity: number;
  maxAcceleration: number;
}

export interface State {
  position: number;
  velocity: number;
}

export class TrapezoidProfile {
  private direction = 1;
  private endAccel = 0;
  private endFullSpeed = 0;
  private endDecel = 0;

  constructor(public constraints: Constraints) {}

  /** The profile's state `t` seconds after `current`, on the way to `goal`. */
  calculate(t: number, current: State, goal: State): State {
    const { maxVelocity, maxAcceleration } = this.constraints;
    this.direction = current.position > goal.position ? -1 : 1;
    const cur = this.direct(current);
    const end = this.direct(goal);
    if (Math.abs(cur.velocity) > maxVelocity) cur.velocity = Math.sign(cur.velocity) * maxVelocity;

    // A start or end velocity is treated as a full trapezoid with its ends cut off.
    const cutoffBegin = cur.velocity / maxAcceleration;
    const cutoffDistBegin = (cutoffBegin * cutoffBegin * maxAcceleration) / 2;
    const cutoffEnd = end.velocity / maxAcceleration;
    const cutoffDistEnd = (cutoffEnd * cutoffEnd * maxAcceleration) / 2;

    const fullTrapezoidDist = cutoffDistBegin + (end.position - cur.position) + cutoffDistEnd;
    let accelerationTime = maxVelocity / maxAcceleration;
    let fullSpeedDist = fullTrapezoidDist - accelerationTime * accelerationTime * maxAcceleration;
    // Too short to reach the maximum velocity: a triangle.
    if (fullSpeedDist < 0) {
      accelerationTime = Math.sqrt(fullTrapezoidDist / maxAcceleration);
      fullSpeedDist = 0;
    }

    this.endAccel = accelerationTime - cutoffBegin;
    this.endFullSpeed = this.endAccel + fullSpeedDist / maxVelocity;
    this.endDecel = this.endFullSpeed + accelerationTime - cutoffEnd;

    let result: State = { ...cur };
    if (t < this.endAccel) {
      result.velocity += t * maxAcceleration;
      result.position += (cur.velocity + (t * maxAcceleration) / 2) * t;
    } else if (t < this.endFullSpeed) {
      result.velocity = maxVelocity;
      result.position += (cur.velocity + (this.endAccel * maxAcceleration) / 2) * this.endAccel + maxVelocity * (t - this.endAccel);
    } else if (t <= this.endDecel) {
      const timeLeft = this.endDecel - t;
      result.velocity = end.velocity + timeLeft * maxAcceleration;
      result.position = end.position - (end.velocity + (timeLeft * maxAcceleration) / 2) * timeLeft;
    } else {
      result = end;
    }
    return this.direct(result);
  }

  /** Total time of the profile from the most recent calculate() call. */
  totalTime(): number {
    return this.endDecel;
  }

  /** Phase boundaries (seconds) from the most recent calculate() call. */
  phases(): { endAccel: number; endFullSpeed: number; endDecel: number } {
    return { endAccel: this.endAccel, endFullSpeed: this.endFullSpeed, endDecel: this.endDecel };
  }

  private direct(s: State): State {
    return { position: s.position * this.direction, velocity: s.velocity * this.direction };
  }
}
