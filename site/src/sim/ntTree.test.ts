import { describe, expect, it } from 'vitest';
import { FlywheelSim } from './flywheelSim';
import { flywheelPresets } from './flywheelPresets';
import { buildTopics, buildTree, FLYWHEEL_TABLE, splitTopic, writeTopic } from './ntTree';

const gains = flywheelPresets.tuned.gains;

describe('NetworkTables tree', () => {
  it('splits a path into table and topic name', () => {
    expect(splitTopic('/Subsystems/FlywheelSubsystem/Tuning/kP')).toEqual({ table: '/Subsystems/FlywheelSubsystem', name: 'Tuning/kP' });
    expect(splitTopic('/Subsystems/FlywheelSubsystem/Velocity RPS').name).toBe('Velocity RPS');
  });

  it('publishes the lesson topics with their types', () => {
    const topics = buildTopics(undefined, gains, undefined);
    const fly = topics.filter((t) => t.path.startsWith(FLYWHEEL_TABLE));
    expect(fly).toHaveLength(10);
    expect(fly.find((t) => t.path.endsWith('At Target'))?.type).toBe('boolean');
    expect(fly.filter((t) => t.tunable)).toHaveLength(5);
  });

  it('nests topics under their folders', () => {
    const tree = buildTree(buildTopics(undefined, gains, undefined));
    const subsystems = tree.children[0];
    expect(subsystems.name).toBe('Subsystems');
    expect(subsystems.children.map((c) => c.name)).toEqual(['FlywheelSubsystem', 'ElevatorSubsystem']);
    expect(subsystems.children[0].children.find((c) => c.name === 'Tuning')?.children).toHaveLength(5);
  });

  it('live values follow the sim', () => {
    const sim = new FlywheelSim(gains);
    let s = sim.step(40);
    for (let i = 0; i < 100; i++) s = sim.step(40);
    const v = buildTopics(s, gains, undefined).find((t) => t.path.endsWith('Velocity RPS'))!.value as number;
    expect(v).toBeGreaterThan(10);
  });

  it('writing a tuning topic changes the gain that the sim uses', () => {
    const next = writeTopic(`${FLYWHEEL_TABLE}/Tuning/kV Volts per RPS`, 0.06, gains);
    expect(next?.kV).toBe(0.06);
    expect(next?.kP).toBe(gains.kP);
    const run = (g: typeof gains) => { const sim = new FlywheelSim(g); let s = sim.step(40); for (let i = 0; i < 200; i++) s = sim.step(40); return s.velocity; };
    expect(run(next!)).not.toBeCloseTo(run(gains), 0);
  });

  it('rejects writes to telemetry topics and bad numbers', () => {
    expect(writeTopic(`${FLYWHEEL_TABLE}/Velocity RPS`, 5, gains)).toBeNull();
    expect(writeTopic(`${FLYWHEEL_TABLE}/Tuning/kP`, NaN, gains)).toBeNull();
    expect(writeTopic(`${FLYWHEEL_TABLE}/Tuning/kQ`, 1, gains)).toBeNull();
  });
});
