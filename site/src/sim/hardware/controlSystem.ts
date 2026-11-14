/**
 * The wiring of a small FRC robot as a graph, and what stops working when one wire breaks.
 * Topology only: the control-system map component owns the drawing.
 */

export type WireLayer = 'power' | 'can' | 'network' | 'dio';

export type NodeId =
  | 'battery' | 'breaker' | 'pdh' | 'roborio' | 'kraken1' | 'kraken2' | 'cancoder' | 'pigeon'
  | 'radio' | 'coprocessor' | 'camera' | 'limit' | 'ds' | 'controller';

export interface Wire {
  id: string;
  layer: WireLayer;
  from: NodeId;
  to: NodeId;
}

const wire = (layer: WireLayer, from: NodeId, to: NodeId): Wire => ({ id: `${layer}:${from}-${to}`, layer, from, to });

/** The CAN bus is one chain. It starts at the roboRIO and ends at the PDH; both ends are terminated. */
export const CAN_CHAIN: NodeId[] = ['roborio', 'kraken1', 'kraken2', 'cancoder', 'pigeon', 'pdh'];

export const wires: Wire[] = [
  wire('power', 'battery', 'breaker'),
  wire('power', 'breaker', 'pdh'),
  ...(['roborio', 'kraken1', 'kraken2', 'cancoder', 'pigeon', 'radio', 'coprocessor'] as const).map((d) => wire('power', 'pdh', d)),
  ...CAN_CHAIN.slice(1).map((d, i) => wire('can', CAN_CHAIN[i], d)),
  wire('network', 'roborio', 'radio'),
  wire('network', 'radio', 'ds'),
  wire('network', 'radio', 'coprocessor'),
  wire('dio', 'limit', 'roborio'),
  wire('dio', 'camera', 'coprocessor'),
  wire('dio', 'controller', 'ds'),
];

export const nodeNames: Record<NodeId, string> = {
  battery: 'battery', breaker: 'main breaker', pdh: 'PDH', roborio: 'roboRIO',
  kraken1: 'Kraken (ID 5)', kraken2: 'Kraken (ID 6)', cancoder: 'CANcoder', pigeon: 'Pigeon 2',
  radio: 'radio', coprocessor: 'coprocessor', camera: 'camera', limit: 'limit switch',
  ds: 'Driver Station laptop', controller: 'Xbox controller',
};

export interface FaultEffects {
  /** Devices with no power. */
  off: NodeId[];
  /** Devices that still have power but that the code can no longer reach. */
  lost: NodeId[];
  /** What you would notice, in plain language. */
  effects: string[];
}

const list = (ids: NodeId[]) => ids.map((n) => nodeNames[n]).join(', ');

const WITHOUT_POWER: Partial<Record<NodeId, string>> = {
  roborio: 'The roboRIO is off, so no robot code runs. The Driver Station shows no communication and nothing moves.',
  kraken1: 'The Kraken with ID 5 has no power. The code still sends it commands, but it cannot move and its readings stop.',
  kraken2: 'The Kraken with ID 6 has no power. The code still sends it commands, but it cannot move and its readings stop.',
  cancoder: 'The CANcoder is off. The code no longer knows that shaft’s angle.',
  pigeon: 'The Pigeon 2 is off. The code no longer knows which way the robot faces.',
  radio: 'The radio is off. The Driver Station loses its connection and the robot disables.',
  coprocessor: 'The coprocessor and its camera are off. No AprilTag results reach the code.',
};

/** What happens when exactly one wire is broken. */
export function faultEffects(wireId: string): FaultEffects {
  const broken = wires.find((w) => w.id === wireId);
  if (!broken) return { off: [], lost: [], effects: [] };

  if (broken.layer === 'power') {
    // Power reaches whatever is still connected to the battery.
    const live = new Set<NodeId>(['battery']);
    const power = wires.filter((w) => w.layer === 'power' && w !== broken);
    for (let grew = true; grew; ) {
      grew = false;
      for (const w of power) {
        if (live.has(w.from) !== live.has(w.to)) { live.add(w.from); live.add(w.to); grew = true; }
      }
    }
    const powered = new Set(wires.filter((w) => w.layer === 'power').flatMap((w) => [w.from, w.to]));
    const off = [...powered].filter((n) => !live.has(n));
    if (off.includes('coprocessor')) off.push('camera'); // the camera is powered through its USB cable
    if (off.includes('pdh')) return { off, lost: [], effects: ['Nothing on the robot has power. No lights, no code, no motion.'] };
    return { off, lost: [], effects: off.flatMap((n) => WITHOUT_POWER[n] ?? []) };
  }

  if (broken.layer === 'can') {
    const lost = CAN_CHAIN.slice(CAN_CHAIN.indexOf(broken.to));
    if (lost.length === 1) {
      return {
        off: [], lost,
        effects: [
          'The code can no longer read currents or bus voltage from the PDH. The motors still work.',
          'That end of the bus has lost its terminating resistor, so the other devices may report occasional CAN errors.',
        ],
      };
    }
    return {
      off: [], lost,
      effects: [
        `The code cannot reach: ${list(lost)}. Commands to them go nowhere and their readings freeze.`,
        'The Driver Station fills with CAN errors. The rest of the bus has also lost a terminating resistor, so it may misbehave too.',
      ],
    };
  }

  if (broken.layer === 'network') {
    if (broken.to === 'coprocessor') {
      return { off: [], lost: ['coprocessor', 'camera'], effects: ['Vision results cannot reach the roboRIO. The code keeps running, but it never sees an AprilTag.'] };
    }
    return {
      off: [], lost: ['ds', 'controller'],
      effects: ['The Driver Station cannot reach the roboRIO. The robot disables, the driver has no control, and you cannot deploy code.'],
    };
  }

  if (broken.from === 'limit') {
    return { off: [], lost: ['limit'], effects: ['The code cannot tell when the mechanism reaches the end of its travel, so homing never finishes.'] };
  }
  if (broken.from === 'camera') {
    return { off: ['camera'], lost: [], effects: ['The coprocessor gets no images, so it reports no targets.'] };
  }
  return { off: [], lost: ['controller'], effects: ['No button or stick input reaches the code. The robot can stay enabled, but it ignores the driver.'] };
}
