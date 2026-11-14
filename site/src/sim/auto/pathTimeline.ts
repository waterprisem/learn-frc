/** A point on the field, in meters. */
export interface Pt {
  x: number;
  y: number;
}

/** A smooth curve through the waypoints (Catmull-Rom), with its length measured so we can ask "where is the robot after s meters?" */
export class PathGeometry {
  readonly points: Pt[] = [];
  private readonly cumulative: number[] = [0];

  constructor(readonly waypoints: Pt[], samplesPerSegment = 24) {
    const w = waypoints;
    if (w.length >= 2) {
      for (let i = 0; i < w.length - 1; i++) {
        const p0 = w[Math.max(0, i - 1)];
        const p1 = w[i];
        const p2 = w[i + 1];
        const p3 = w[Math.min(w.length - 1, i + 2)];
        for (let k = 0; k < samplesPerSegment; k++) {
          const t = k / samplesPerSegment;
          const f = (a: number, b: number, c: number, d: number) =>
            0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
          this.points.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
        }
      }
      this.points.push({ ...w[w.length - 1] });
    } else this.points.push(...w);
    for (let i = 1; i < this.points.length; i++) {
      this.cumulative.push(this.cumulative[i - 1] + Math.hypot(this.points[i].x - this.points[i - 1].x, this.points[i].y - this.points[i - 1].y));
    }
  }

  get length(): number {
    return this.cumulative[this.cumulative.length - 1];
  }

  /** The point `s` meters along the path, and the direction of travel in degrees. */
  pointAt(s: number): Pt & { angle: number } {
    const pts = this.points;
    if (pts.length === 0) return { x: 0, y: 0, angle: 0 };
    if (pts.length === 1) return { ...pts[0], angle: 0 };
    const d = Math.min(Math.max(s, 0), this.length);
    let lo = 0;
    let hi = pts.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cumulative[mid] <= d) lo = mid;
      else hi = mid;
    }
    const span = this.cumulative[hi] - this.cumulative[lo] || 1;
    const f = (d - this.cumulative[lo]) / span;
    const a = pts[lo];
    const b = pts[hi];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI };
  }
}

/** How far along the path the robot is at each moment. */
export interface Timeline {
  duration: number;
  distanceAt(t: number): number;
  speedAt(t: number): number;
}

export function constantTimeline(length: number, speed: number): Timeline {
  const duration = length / speed;
  return {
    duration,
    distanceAt: (t) => Math.min(Math.max(t, 0), duration) * speed,
    speedAt: (t) => (t < 0 || t > duration ? 0 : speed),
  };
}

/** Speed up at the maximum acceleration, cruise, slow down: a trapezoid, or a triangle on a short path. */
export function trapezoidTimeline(length: number, maxVelocity: number, maxAcceleration: number): Timeline {
  const triangle = length < (maxVelocity * maxVelocity) / maxAcceleration;
  const peak = triangle ? Math.sqrt(length * maxAcceleration) : maxVelocity;
  const ta = peak / maxAcceleration;
  const cruise = triangle ? 0 : (length - peak * ta) / peak;
  const duration = 2 * ta + cruise;
  return {
    duration,
    distanceAt(t) {
      const x = Math.min(Math.max(t, 0), duration);
      if (x < ta) return 0.5 * maxAcceleration * x * x;
      if (x < ta + cruise) return 0.5 * peak * ta + peak * (x - ta);
      const r = duration - x;
      return length - 0.5 * maxAcceleration * r * r;
    },
    speedAt(t) {
      if (t < 0 || t > duration) return 0;
      if (t < ta) return maxAcceleration * t;
      if (t < ta + cruise) return peak;
      return maxAcceleration * (duration - t);
    },
  };
}

/** The moment the robot reaches `fraction` (0 to 1) of the path length. */
export function timeAtFraction(timeline: Timeline, length: number, fraction: number): number {
  const target = Math.min(Math.max(fraction, 0), 1) * length;
  let lo = 0;
  let hi = timeline.duration;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (timeline.distanceAt(mid) < target) lo = mid;
    else hi = mid;
  }
  return hi;
}

export interface Marker {
  id: number;
  name: string;
  /** Position along the path, 0 to 1 of its length. */
  at: number;
}

/**
 * What the robot code registered: a name the code recognizes. The team's names are all capitals.
 * `kind: 'start'` runs a mechanism command; `kind: 'stop'` ends the one started earlier.
 */
export const REGISTERED = {
  PREPARE_TO_SHOOT: { label: 'Hood, flywheel and turret', kind: 'start' },
  STOP_TURRETED_SHOOTING: { label: 'Ends the shot command', kind: 'stop' },
} as const;
export type RegisteredName = keyof typeof REGISTERED;

export interface Firing {
  marker: Marker;
  time: number;
  /** False when no binding matches the name exactly, so nothing happens. */
  bound: boolean;
}

/** When each marker is reached, in time order, and whether the code knows its name (exact, case-sensitive match). */
export function fireMarkers(markers: Marker[], timeline: Timeline, length: number): Firing[] {
  return markers
    .map((marker) => ({
      marker,
      time: timeAtFraction(timeline, length, marker.at),
      bound: Object.prototype.hasOwnProperty.call(REGISTERED, marker.name),
    }))
    .sort((a, b) => a.time - b.time || a.marker.id - b.marker.id);
}

export interface CommandRun {
  markerId: number;
  name: string;
  start: number;
  end: number;
  /** Whether a stop marker ended it or the auto ran out first. */
  endedBy: 'marker' | 'auto end';
}

/** The mechanism commands that run, overlapping the drive. A start runs until the next bound stop marker, or until the auto ends. */
export function commandRuns(firings: Firing[], duration: number): CommandRun[] {
  const runs: CommandRun[] = [];
  for (const f of firings) {
    if (!f.bound || REGISTERED[f.marker.name as RegisteredName].kind !== 'start') continue;
    const stop = firings.find((g) => g.bound && g.time > f.time && REGISTERED[g.marker.name as RegisteredName].kind === 'stop');
    runs.push({ markerId: f.marker.id, name: f.marker.name, start: f.time, end: stop ? stop.time : duration, endedBy: stop ? 'marker' : 'auto end' });
  }
  return runs;
}
