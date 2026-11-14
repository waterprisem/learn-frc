/** The 14 steps of lesson 1.10, from pressing Xbox A to a graph. */
export type Layer = 'USB' | 'Network' | 'Code' | 'CAN' | 'Physics';
export const layers: Layer[] = ['USB', 'Network', 'Code', 'CAN', 'Physics'];

export interface JourneyStep {
  n: number;
  layer: Layer;
  where: string;
  what: string;
  /** Runs inside the 20 ms robot loop. */
  inLoop: boolean;
  /** Travelling back toward the graph rather than out to the motor. */
  returning: boolean;
}

const s = (n: number, layer: Layer, where: string, what: string, inLoop = false, returning = false): JourneyStep =>
  ({ n, layer, where, what, inLoop, returning });

export const journey: JourneyStep[] = [
  s(1, 'USB', 'Controller', 'The controller reports that A is down.'),
  s(2, 'USB', 'Driver Station laptop', 'The Driver Station reads the controller and packs it into its next message, about every 20 ms.'),
  s(3, 'Network', 'Wi-Fi to the radio', 'The message travels over Wi-Fi to the radio on the robot.'),
  s(4, 'Network', 'Ethernet to the roboRIO', 'The radio passes it over Ethernet. WPILib on the roboRIO now knows A is pressed.'),
  s(5, 'Code', 'Scheduler', 'The CommandScheduler checks all triggers and sees driverController.a() became true.', true),
  s(6, 'Code', 'Command', 'whileTrue schedules a SetFlywheelVoltageCommand. Its execute() now runs every loop.', true),
  s(7, 'Code', 'Subsystem', 'execute() calls setFlywheelVoltage(6.0), which calls setControl(new VoltageOut(volts)) on the TalonFX.', true),
  s(8, 'CAN', 'Frame', 'Phoenix 6 turns the request into a CAN frame addressed to CAN ID 1.'),
  s(9, 'CAN', 'TalonFX', 'The TalonFX reads the frame and switches battery power to the motor so it averages 6 V.'),
  s(10, 'Physics', 'Motor', 'Current flows, the motor makes torque, and the wheel speeds up. This is the slowest step.'),
  s(11, 'Physics', 'Encoder', "The motor's built-in sensor measures the new speed.", false, true),
  s(12, 'CAN', 'Report back', 'The TalonFX sends the speed back to the roboRIO in CAN frames.', false, true),
  s(13, 'Code', 'periodic()', 'Each loop, the speed is read and published to NetworkTables.', true, true),
  s(14, 'Network', 'AdvantageScope', 'AdvantageScope reads /Subsystems/FlywheelSubsystem/Velocity RPS and draws the graph.', false, true),
];

export const clampStep = (i: number): number => Math.min(Math.max(i, 0), journey.length - 1);
