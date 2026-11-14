import type { ElevatorSample } from './elevatorSim';
import type { FlywheelGains, FlywheelSample } from './flywheelSim';

/** A NetworkTables topic: a full path, a type and the latest value. */
export interface NtTopic {
  path: string;
  type: 'double' | 'boolean';
  value: number | boolean;
  /** The robot code subscribes to this topic, so writing it changes the sim. */
  tunable?: boolean;
}

export const FLYWHEEL_TABLE = '/Subsystems/FlywheelSubsystem';
export const ELEVATOR_TABLE = '/Subsystems/ElevatorSubsystem';

/** Tuning topic name -> the gain it feeds. Names are the lab's (kS and kV carry their units). */
export const TUNING_TOPICS: Record<string, keyof FlywheelGains> = {
  kP: 'kP',
  kI: 'kI',
  kD: 'kD',
  'kS Volts': 'kS',
  'kV Volts per RPS': 'kV',
};

/** Split `/Subsystems/FlywheelSubsystem/Tuning/kP` into its table and its topic name. */
export function splitTopic(path: string): { table: string; name: string } {
  const parts = path.split('/').filter(Boolean);
  // A table is the subsystem folder; anything below it (such as Tuning/) belongs to the topic name.
  const table = '/' + parts.slice(0, 2).join('/');
  return { table, name: parts.slice(2).join('/') };
}

/** Every topic the two subsystems publish, in the order shown in the lesson. */
export function buildTopics(
  fly: FlywheelSample | undefined,
  gains: FlywheelGains,
  elev: ElevatorSample | undefined,
): NtTopic[] {
  const f = FLYWHEEL_TABLE;
  const e = ELEVATOR_TABLE;
  const tuning = (Object.keys(TUNING_TOPICS) as Array<keyof typeof TUNING_TOPICS>).map(
    (name): NtTopic => ({ path: `${f}/Tuning/${name}`, type: 'double', value: gains[TUNING_TOPICS[name]], tunable: true }),
  );
  return [
    { path: `${f}/Velocity RPS`, type: 'double', value: fly?.velocity ?? 0 },
    { path: `${f}/Target RPS`, type: 'double', value: fly?.target ?? 0 },
    { path: `${f}/Error RPS`, type: 'double', value: fly?.error ?? 0 },
    { path: `${f}/Output Voltage`, type: 'double', value: fly?.output ?? 0 },
    { path: `${f}/At Target`, type: 'boolean', value: fly?.atTarget ?? false },
    ...tuning,
    { path: `${e}/Target Meters`, type: 'double', value: elev?.goal ?? 0 },
    { path: `${e}/Profiled Setpoint Meters`, type: 'double', value: elev?.setpoint ?? 0 },
    { path: `${e}/Height Meters`, type: 'double', value: elev?.height ?? 0 },
    { path: `${e}/Error Meters`, type: 'double', value: elev?.error ?? 0 },
    { path: `${e}/Output Voltage`, type: 'double', value: elev?.output ?? 0 },
    { path: `${e}/At Target`, type: 'boolean', value: elev?.atTarget ?? false },
  ];
}

export interface NtNode {
  name: string;
  path: string;
  children: NtNode[];
  topic?: NtTopic;
}

/** Fold topic paths into a folder tree (folders first only by insertion order). */
export function buildTree(topics: NtTopic[]): NtNode {
  const root: NtNode = { name: '', path: '', children: [] };
  for (const topic of topics) {
    let node = root;
    for (const part of topic.path.split('/').filter(Boolean)) {
      const path = `${node.path}/${part}`;
      let next = node.children.find((c) => c.name === part);
      if (!next) {
        next = { name: part, path, children: [] };
        node.children.push(next);
      }
      node = next;
    }
    node.topic = topic;
  }
  return root;
}

/** Write a value to a tuning topic. Returns the new gains, or null if the topic is not a tunable one. */
export function writeTopic(path: string, value: number, gains: FlywheelGains): FlywheelGains | null {
  if (!Number.isFinite(value)) return null;
  const { table, name } = splitTopic(path);
  if (table !== FLYWHEEL_TABLE || !name.startsWith('Tuning/')) return null;
  const key = TUNING_TOPICS[name.slice('Tuning/'.length)];
  return key ? { ...gains, [key]: Math.max(0, value) } : null;
}

export function formatValue(t: NtTopic): string {
  if (typeof t.value === 'boolean') return t.value ? 'true' : 'false';
  const v = t.value;
  return Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(Math.abs(v) < 10 ? 3 : 2);
}
