import { describe, expect, it } from 'vitest';
import { commandRuns, constantTimeline, fireMarkers, PathGeometry, timeAtFraction, trapezoidTimeline, type Marker } from './auto/pathTimeline';

const straight = new PathGeometry([{ x: 0, y: 0 }, { x: 4, y: 0 }]);

describe('path geometry', () => {
  it('measures a straight path and reports position and direction', () => {
    expect(straight.length).toBeCloseTo(4, 6);
    const p = straight.pointAt(1);
    expect(p.x).toBeCloseTo(1, 6);
    expect(p.angle).toBeCloseTo(0, 6);
  });

  it('passes through every waypoint and is longer than the straight chords when it bends', () => {
    const w = [{ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 4, y: 0 }];
    const g = new PathGeometry(w);
    expect(g.points).toContainEqual(w[1]);
    expect(g.length).toBeGreaterThan(2 * Math.hypot(2, 2) - 1e-9);
  });

  it('handles fewer than two waypoints', () => {
    expect(new PathGeometry([]).length).toBe(0);
    expect(new PathGeometry([{ x: 1, y: 1 }]).pointAt(3)).toMatchObject({ x: 1, y: 1 });
  });
});

describe('timelines', () => {
  it('constant speed takes length over speed', () => {
    const tl = constantTimeline(4, 2);
    expect(tl.duration).toBe(2);
    expect(tl.distanceAt(1)).toBe(1 * 2);
  });

  it('a trapezoid takes longer than constant at the same top speed, and ends at rest', () => {
    const tl = trapezoidTimeline(4, 2, 2);
    expect(tl.duration).toBeCloseTo(3, 6); // 1 s up, 1 s cruise over 2 m, 1 s down
    expect(tl.distanceAt(tl.duration)).toBeCloseTo(4, 6);
    expect(tl.speedAt(0.5)).toBeCloseTo(1, 6);
    expect(tl.speedAt(1.5)).toBeCloseTo(2, 6);
    expect(tl.speedAt(tl.duration)).toBeCloseTo(0, 6);
    expect(tl.duration).toBeGreaterThan(constantTimeline(4, 2).duration);
  });

  it('a short path becomes a triangle that never reaches top speed', () => {
    const tl = trapezoidTimeline(1, 5, 2);
    let top = 0;
    for (let t = 0; t <= tl.duration; t += 0.01) top = Math.max(top, tl.speedAt(t));
    expect(top).toBeLessThan(5);
    expect(tl.distanceAt(tl.duration)).toBeCloseTo(1, 6);
  });

  it('the same position is reached at different times by different timelines', () => {
    const c = timeAtFraction(constantTimeline(4, 2), 4, 0.1);
    const t = timeAtFraction(trapezoidTimeline(4, 2, 2), 4, 0.1);
    expect(c).toBeCloseTo(0.2, 4);
    expect(t).toBeGreaterThan(c);
    expect(timeAtFraction(trapezoidTimeline(4, 2, 2), 4, 0.5)).toBeCloseTo(1.5, 4);
  });
});

describe('event markers', () => {
  const tl = constantTimeline(4, 2);
  const markers: Marker[] = [
    { id: 1, name: 'PREPARE_TO_SHOOT', at: 0.25 },
    { id: 2, name: 'STOP_TURRETED_SHOOTING', at: 0.75 },
    { id: 3, name: 'Prepare_To_Shoot', at: 0.5 },
  ];

  it('fires in path order and requires an exact, case-sensitive name', () => {
    const f = fireMarkers(markers, tl, 4);
    expect(f.map((x) => x.marker.id)).toEqual([1, 3, 2]);
    expect(f.find((x) => x.marker.id === 3)!.bound).toBe(false);
    expect(f.find((x) => x.marker.id === 1)!.time).toBeCloseTo(0.5, 4);
  });

  it('a start command runs until the stop marker, so it overlaps the driving', () => {
    const runs = commandRuns(fireMarkers(markers, tl, 4), tl.duration);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({ endedBy: 'marker' });
    expect(runs[0].start).toBeCloseTo(0.5, 4);
    expect(runs[0].end).toBeCloseTo(1.5, 4);
    expect(runs[0].end).toBeLessThan(tl.duration + 1e-9);
  });

  it('without a stop marker the command runs until the auto ends', () => {
    const runs = commandRuns(fireMarkers([markers[0]], tl, 4), tl.duration);
    expect(runs[0]).toMatchObject({ end: tl.duration, endedBy: 'auto end' });
  });
});
