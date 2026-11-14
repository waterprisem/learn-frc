/**
 * The hardware catalogue: one entry per device, shown as a component card in the robot tour,
 * the control-system map and the Track 1 lessons.
 */

export type Layer = 'power' | 'can' | 'network' | 'dio';

/** How each kind of connection is drawn. Each layer has its own color and its own line pattern. */
export const LAYERS: Record<Layer, { label: string; cssVar: string; dash?: string; width: number }> = {
  power: { label: 'Power', cssVar: '--layer-power', width: 3 },
  can: { label: 'CAN', cssVar: '--layer-can', dash: '9 4', width: 2 },
  network: { label: 'Network', cssVar: '--layer-network', dash: '2 4', width: 2 },
  dio: { label: 'DIO / USB', cssVar: '--layer-dio', dash: '10 3 2 3', width: 2 },
};

export interface Device {
  name: string;
  /** One sentence that describes the job without naming the part (used by the tour's "Find it" mode). */
  clue: string;
  what: string;
  where: string;
  connects: Layer[];
  /** How code sees it: one line of Java, or a short note when there is no code. */
  code?: string;
  codeNote?: string;
  failures: Array<{ symptom: string; cause: string }>;
  lesson?: { href: string; label: string };
}

export const devices = {
  battery: {
    name: 'Battery',
    clue: 'The only source of electrical power on the robot.',
    what: 'One 12 V sealed lead-acid battery. Everything on the robot runs from it.',
    where: 'Low in the frame, strapped down so it cannot fall out in a collision.',
    connects: ['power'],
    code: 'RobotController.getBatteryVoltage()',
    failures: [
      { symptom: 'The robot stutters or restarts when it pushes hard', cause: 'the battery is low, old, or its connector is loose' },
    ],
    lesson: { href: '/robot/power/', label: '1.3 Power' },
  },
  breaker: {
    name: 'Main breaker',
    clue: 'The switch you hit first in an electrical emergency.',
    what: 'A 120 A breaker with a red off button. It is the power switch for the whole robot.',
    where: 'Next to the battery, where a person can reach it quickly.',
    connects: ['power'],
    codeNote: 'No code. It is a manual switch.',
    failures: [{ symptom: 'Nothing on the robot lights up', cause: 'the breaker is off, or it tripped' }],
    lesson: { href: '/robot/power/', label: '1.3 Power' },
  },
  pdh: {
    name: 'Power Distribution Hub (PDH)',
    clue: 'Splits battery power into one protected channel per device.',
    what: 'Sends battery power to every device through its own channel, each protected by a breaker or fuse.',
    where: 'On the electronics panel, close to the battery.',
    connects: ['power', 'can'],
    code: 'new PowerDistribution(1, ModuleType.kRev)',
    failures: [
      { symptom: 'One device has no lights while the rest work', cause: 'its breaker or fuse is missing or tripped, or its power wire is loose' },
    ],
    lesson: { href: '/robot/power/', label: '1.3 Power' },
  },
  roborio: {
    name: 'roboRIO',
    clue: 'The computer that runs your Java code.',
    what: 'The robot’s computer. Your program runs here, 50 times a second.',
    where: 'On the electronics panel, with its status lights visible.',
    connects: ['power', 'can', 'network', 'dio'],
    codeNote: 'Your whole program runs on it. You deploy code to it.',
    failures: [
      { symptom: 'The Driver Station shows “No Robot Code”', cause: 'the program crashed or is still starting' },
      { symptom: 'The Driver Station shows “No Robot Communication”', cause: 'the roboRIO has no power, or the network link is down' },
    ],
    lesson: { href: '/robot/roborio-can/', label: '1.5 roboRIO and the CAN bus' },
  },
  radio: {
    name: 'Radio',
    clue: 'Creates the Wi-Fi link between the robot and the driver’s laptop.',
    what: 'A Wi-Fi access point (the VH-109). It links the roboRIO to the Driver Station laptop.',
    where: 'High on the robot and away from metal and motors, so the signal is clear.',
    connects: ['power', 'network'],
    codeNote: 'No code. Its address is always 10.TE.AM.1 (10.13.60.1 for team 1360).',
    failures: [
      { symptom: 'The laptop cannot find the robot', cause: 'the radio is still starting up, has no power, or is set up for another team number' },
    ],
    lesson: { href: '/robot/networking/', label: '1.9 Networking' },
  },
  kraken: {
    name: 'Kraken X60 motor (TalonFX)',
    clue: 'Turns electrical power into rotation, with its controller built in.',
    what: 'A brushless motor with a TalonFX motor controller inside the housing. Code sends it requests; it sends back position and velocity.',
    where: 'On every mechanism: each swerve module, the elevator, the arm, the shooter.',
    connects: ['power', 'can'],
    code: 'new TalonFX(5)',
    failures: [
      { symptom: 'The motor never moves', cause: 'the CAN ID in code does not match the device, or the robot is disabled' },
      { symptom: 'The mechanism runs backwards', cause: 'the inversion setting is wrong' },
    ],
    lesson: { href: '/robot/motors/', label: '1.4 Motors and motor controllers' },
  },
  cancoder: {
    name: 'CANcoder',
    clue: 'Measures the exact angle of a shaft, and still knows it after a restart.',
    what: 'A magnetic absolute encoder. It reports the angle of a shaft, and it knows that angle as soon as it powers on.',
    where: 'On a shaft whose angle matters at startup, such as a swerve module’s steering axis.',
    connects: ['power', 'can'],
    code: 'new CANcoder(11)',
    failures: [
      { symptom: 'The angle is wrong by the same amount every time', cause: 'the magnet offset was never set, or the sensor was remounted' },
    ],
    lesson: { href: '/robot/sensors/', label: '1.6 Sensors in action' },
  },
  pigeon: {
    name: 'Pigeon 2 (IMU)',
    clue: 'Tells the code which way the robot is facing.',
    what: 'An inertial measurement unit. It measures the robot’s heading (yaw), plus pitch and roll.',
    where: 'Flat and rigidly mounted, near the center of the robot.',
    connects: ['power', 'can'],
    code: 'new Pigeon2(13)',
    failures: [
      { symptom: 'Field-relative driving goes in the wrong direction', cause: 'the heading was not zeroed while the robot faced the right way' },
    ],
    lesson: { href: '/robot/sensors/', label: '1.6 Sensors in action' },
  },
  'limit-switch': {
    name: 'Limit switch',
    clue: 'Tells the code that a mechanism has reached the end of its travel.',
    what: 'A switch that a mechanism presses at the end of its travel. It gives the code a known position to measure from.',
    where: 'At a hard stop, such as the bottom of the elevator.',
    connects: ['dio'],
    code: 'new DigitalInput(0)',
    failures: [
      { symptom: 'Homing never finishes', cause: 'the switch is unplugged, or the mechanism does not reach it' },
    ],
    lesson: { href: '/robot/sensors/', label: '1.6 Sensors in action' },
  },
  camera: {
    name: 'Camera and coprocessor',
    clue: 'Finds AprilTags so the robot can work out where it is.',
    what: 'A camera plugged into a small computer running PhotonVision. It finds AprilTags and sends the results to the roboRIO.',
    where: 'The camera faces outward with a clear view. The coprocessor sits on the electronics panel.',
    connects: ['power', 'network', 'dio'],
    code: 'new PhotonCamera("front")',
    failures: [
      { symptom: 'The code never sees a target', cause: 'the camera name in code does not match the name in PhotonVision, or the coprocessor is still starting' },
    ],
  },
  ds: {
    name: 'Driver Station laptop',
    clue: 'Enables and disables the robot and passes on the driver’s input.',
    what: 'The laptop that runs the Driver Station app. It enables and disables the robot and sends joystick input to it.',
    where: 'Off the robot, with the drivers.',
    connects: ['network', 'dio'],
    codeNote: 'No robot code runs here. It talks to the roboRIO at 10.TE.AM.2.',
    failures: [
      { symptom: 'The Enable button is greyed out', cause: 'there is no communication, no robot code, or no joystick' },
    ],
    lesson: { href: '/robot/networking/', label: '1.9 Networking' },
  },
  controller: {
    name: 'Xbox controller',
    clue: 'What the driver holds.',
    what: 'The driver’s buttons and sticks. The Driver Station reads it and sends its state to the robot every 20 ms.',
    where: 'Plugged into the Driver Station laptop by USB.',
    connects: ['dio'],
    code: 'new CommandXboxController(0)',
    failures: [
      { symptom: 'Buttons do nothing', cause: 'the controller is in a different USB slot than the port number in code' },
    ],
  },
} satisfies Record<string, Device>;

export type DeviceId = keyof typeof devices;
