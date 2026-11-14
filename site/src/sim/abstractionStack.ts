/** The abstraction stack and path from lesson 1.12. */
export interface StackLayer {
  id: string;
  name: string;
  detail: string;
}

export const stackLayers: StackLayer[] = [
  { id: 'code', name: 'Your Java code', detail: 'Calls a method' },
  { id: 'api', name: 'WPILib / Phoenix 6 API', detail: 'Turns the call into a message' },
  { id: 'can', name: 'CAN bus', detail: 'Carries frames' },
  { id: 'talon', name: 'Motor controller (TalonFX)', detail: 'Reads the frame, drives the motor' },
  { id: 'motor', name: 'Motor', detail: 'Turns current into torque' },
  { id: 'mech', name: 'Mechanism and encoder', detail: 'Moves, and measures the movement' },
];

export interface PathStep {
  layer: number; // index into stackLayers
  returning: boolean;
  text: string;
}

/** The nine numbered steps of the lesson. */
export const path: PathStep[] = [
  { layer: 0, returning: false, text: 'Your Java code calls a method.' },
  { layer: 1, returning: false, text: 'The API turns the call into a message.' },
  { layer: 2, returning: false, text: 'A CAN frame travels on the bus.' },
  { layer: 3, returning: false, text: 'The TalonFX reads the frame and drives the motor.' },
  { layer: 4, returning: false, text: 'The motor turns current into torque and rotation.' },
  { layer: 5, returning: false, text: 'The mechanism moves.' },
  { layer: 5, returning: true, text: 'The encoder turns the rotation into position and velocity data.' },
  { layer: 2, returning: true, text: 'A CAN frame carries that data back to the roboRIO.' },
  { layer: 0, returning: true, text: 'Your Java code reads the sensor value.' },
];

export interface Fault {
  layer: number;
  name: string;
  /** How many path steps work before the signal dies. */
  completed: number;
  symptoms: string[];
  check: string;
}

export const faults: Fault[] = [
  { layer: 0, name: 'The command is never scheduled', completed: 0, symptoms: ['Nothing is logged from execute()', 'The mechanism does not move'], check: 'Print or log from execute(); check where the command is bound.' },
  { layer: 1, name: 'The robot is not enabled', completed: 1, symptoms: ['The code runs but the motor ignores it', 'The Driver Station shows Disabled'], check: 'Check that the Driver Station shows Enabled.' },
  { layer: 2, name: 'Wrong CAN ID', completed: 2, symptoms: ['The mechanism does not move', 'No error in the code'], check: 'Compare the ID in Constants.java with Phoenix Tuner X.' },
  { layer: 3, name: 'Current limit set too low', completed: 3, symptoms: ['The command arrives but the mechanism does not move', 'The code and the wiring look fine'], check: 'Read the limit in the config and in Phoenix Tuner X.' },
  { layer: 4, name: 'The motor is stalled', completed: 4, symptoms: ['The TalonFX is trying but nothing turns'], check: 'Look at power, a jam, or a stalled motor.' },
  { layer: 5, name: 'The encoder is loose', completed: 6, symptoms: ['The mechanism moves but the position reading drifts', 'It looks like bad tuning or bad code'], check: 'Check that the encoder is firmly attached.' },
];

export const faultAt = (layer: number): Fault | undefined => faults.find((f) => f.layer === layer);

export interface Outcome {
  /** Steps the signal passes through, ending at the step where it dies (if it does). */
  steps: number[];
  stuckAt: number | null;
  indicators: Array<{ label: string; ok: boolean }>;
}

export function outcome(fault: Fault | null): Outcome {
  const completed = fault ? fault.completed : path.length;
  const steps = Array.from({ length: Math.min(completed + 1, path.length) }, (_, i) => i);
  return {
    steps,
    stuckAt: fault ? completed : null,
    indicators: [
      { label: 'Code sends the command', ok: completed >= 1 },
      { label: 'The command arrives over CAN', ok: completed >= 3 },
      { label: 'The mechanism moves', ok: completed >= 6 },
      { label: 'Code reads a correct value', ok: completed >= path.length },
    ],
  };
}
