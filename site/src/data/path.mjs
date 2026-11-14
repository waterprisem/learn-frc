// @ts-check
/**
 * The learning path: single source of truth for tracks and lessons.
 * Used by the sidebar config, the home-page path map, and scripts/gen-stubs.mjs.
 *
 * Lesson tuple: [id, slug, title, session, isNew, summary]
 *   session = curriculum session number (or null for content the curriculum doesn't have)
 *   isNew   = true when the lesson goes beyond the Orbit curriculum
 */

/** @typedef {[string, string, string, number | null, boolean, string]} LessonTuple */
/** @typedef {{ key: string, dir: string, label: string, blurb: string, milestone: string, lessons: LessonTuple[] }} Track */

/** @type {Track[]} */
export const tracks = [
  {
    key: '0', dir: 'foundations', label: 'Foundations', milestone: 'M2',
    blurb: 'Just enough Java, tools, math, and physics to read and write robot code.',
    lessons: [
      ['0.1', 'how-to-use-this-site', 'How to use this site', null, true, 'How lessons, playgrounds, practice, and real-tool missions fit together.'],
      ['0.2', 'java-basics', 'Java I: variables, types, methods', null, true, 'Variables, types, methods, and control flow, taught through robot-code examples.'],
      ['0.3', 'java-classes', 'Java II: classes and objects', null, true, 'Classes, objects, constructors, extends and @Override, and interfaces.'],
      ['0.4', 'java-structure', 'Java III: static, final, packages, generics', null, true, 'static and final, packages and imports, generics, enums, and builder-style method chaining.'],
      ['0.5', 'java-lambdas', 'Java IV: lambdas and suppliers', null, true, 'Lambdas, suppliers, method references, and the "effectively final" rule.'],
      ['0.6', 'tools', 'Tools: VS Code, Gradle, reading errors', null, true, 'The WPILib VS Code, build vs deploy, and how to read compiler errors and stack traces.'],
      ['0.7', 'git', 'Git and GitHub team workflow', null, true, 'Clone, branch, commit, push, pull requests, reviews, and merge conflicts.'],
      ['0.8', 'math', 'Math for robots', null, true, 'Units, gear ratios, radians, trigonometry, vectors, and reading position/velocity graphs.'],
      ['0.9', 'physics', 'Physics for robots', null, true, 'Voltage, current, torque, gravity, friction, and inertia, and why the tuning constants exist.'],
    ],
  },
  {
    key: '1', dir: 'robot', label: 'The Robot', milestone: 'M2',
    blurb: 'Every part of an FRC robot, how the parts connect, and how code sees them.',
    lessons: [
      ['1.1', 'robot-tour', 'Robot tour', 1, false, 'An interactive labeled robot: click a part to see what it does.'],
      ['1.2', 'control-system-map', 'The control-system map', 1, true, 'One wiring diagram with power, CAN, network, and sensor layers you can switch on and off.'],
      ['1.3', 'power', 'Power: battery, breaker, PDH', 1, false, 'The battery, main breaker, power distribution, fuses, current draw, and brownouts.'],
      ['1.4', 'motors', 'Motors and motor controllers', 1, false, 'Brushless motors, the TalonFX/Kraken, coast vs brake, current limits, and recognizing REV hardware.'],
      ['1.5', 'roborio-can', 'roboRIO and the CAN bus', 1, false, 'What runs on the robot controller, CAN IDs, bus wiring, and CAN fault symptoms.'],
      ['1.6', 'sensors', 'Sensors in action', 1, false, 'Encoders (relative vs absolute), limit switches and homing, the IMU, and cameras.'],
      ['1.7', 'mechanisms', 'Mechanisms gallery', null, true, 'Flywheel, intake, elevator, arm, swerve module, and climber, each with motor, gearing, and sensor labeled.'],
      ['1.8', 'gearing', 'Gearing and motion', null, true, 'How motor rotations become mechanism meters or degrees through gears, sprockets, and pulleys.'],
      ['1.9', 'networking', 'Networking: IPs, radio, Driver Station', 1, false, 'LANs, the 10.TE.AM.X scheme, the radio, the Driver Station, and the field network.'],
      ['1.10', 'button-journey', 'Follow one button press', null, true, 'An end-to-end trace from an Xbox button through the hardware and code and back to a graph.'],
      ['1.11', 'software-ecosystem', 'Software ecosystem', 1, false, 'WPILib, vendor libraries, and installing the tools.'],
      ['1.12', 'robot-loop', 'Thinking like a robot programmer', 1, false, 'The 20 ms loop, the abstraction stack, and finding faults layer by layer.'],
      ['1.13', 'robot-modes', 'Robot modes and lifecycle', null, true, 'Disabled, autonomous, teleop, and test, and what the code does in each.'],
      ['1.14', 'safety', 'Safety around a live robot', null, true, 'Enable and disable, E-stop, and battery handling.'],
    ],
  },
  {
    key: 'R', dir: 'tools', label: 'Real Tools', milestone: 'M2',
    blurb: 'Short how-to guides for the real tools you will use on the team.',
    lessons: [
      ['R.1', 'install-wpilib', 'Install WPILib and open a lab', 1, false, 'Install WPILib and open a curriculum lab project in the WPILib VS Code.'],
      ['R.2', 'simulator', 'Run the simulator', 2, false, 'Start the simulator, enable teleop, and use a keyboard or gamepad as the joystick.'],
      ['R.3', 'advantagescope', 'AdvantageScope', 2, false, 'Connect to the simulator or robot, graph signals, view mechanisms and the field, and open saved logs.'],
      ['R.4', 'driver-station', 'Driver Station', 2, false, 'Modes, enable and disable, E-stop, joysticks, diagnostics, and logs.'],
      ['R.5', 'deploy', 'Deploy code to the robot', null, true, 'Deploying to a real robot and what changes compared with simulation.'],
      ['R.6', 'tuner-x', 'Phoenix Tuner X', null, true, 'Find devices, set CAN IDs, update firmware, run a self-test, and plot a signal.'],
      ['R.7', 'pathplanner-gui', 'PathPlanner GUI', 17, false, 'Create paths and autos in the PathPlanner app.'],
      ['R.8', 'photonvision-ui', 'PhotonVision web UI', 15, false, 'View camera pipelines and AprilTag detections.'],
      ['R.9', 'git-in-vscode', 'Git in VS Code', null, true, 'Commit, push, pull, and switch branches from the editor.'],
    ],
  },
  {
    key: '2', dir: 'commands', label: 'Command-Based Code', milestone: 'M3',
    blurb: 'How robot code is organized: subsystems, commands, the scheduler, and bindings.',
    lessons: [
      ['2.1', 'project-map', 'Project map', 2, false, 'Robot, RobotContainer, Constants, subsystems, and commands: what lives where.'],
      ['2.2', 'subsystems', 'Subsystems own hardware', 2, false, 'Why each mechanism gets one class that owns its motors and sensors.'],
      ['2.3', 'command-lifecycle', 'Command lifecycle', 3, false, 'initialize, execute, isFinished, and end, stepped through one loop at a time.'],
      ['2.4', 'scheduler', 'Scheduler and requirements', 2, false, 'How the scheduler runs commands and why two commands cannot share a subsystem.'],
      ['2.5', 'triggers', 'Triggers and bindings', 3, false, 'onTrue, whileTrue, toggleOnTrue, and default commands.'],
      ['2.6', 'sim-vs-ds', 'Simulator vs Driver Station', 2, false, 'What the simulator replaces, and where AdvantageScope fits.'],
      ['2.7', 'phoenix6', 'CTRE Phoenix 6 basics', 3, false, 'TalonFX, configs, control requests, and status signals.'],
      ['2.8', 'open-loop-flywheel', 'Build the open-loop flywheel', 3, false, 'An annotated walkthrough of Lab 3, then do it for real.'],
    ],
  },
  {
    key: '3', dir: 'control', label: 'Control Theory', milestone: 'M3',
    blurb: 'Making mechanisms reach a target smoothly: PID, feedforward, and motion profiles.',
    lessons: [
      ['3.1', 'open-vs-closed-loop', 'Open vs closed loop', 4, false, 'Why a fixed voltage does not give a fixed speed.'],
      ['3.2', 'loop-vocabulary', 'Setpoint, measurement, error, output', 4, false, 'The five words every control loop is described with.'],
      ['3.3', 'pid', 'PID intuition', 4, false, 'What P, I, and D each do, with a playground.'],
      ['3.4', 'feedforward', 'Feedforward', 4, false, 'Predicting the voltage a mechanism needs with kS and kV.'],
      ['3.5', 'velocity-control', 'Velocity control: PID + feedforward', 4, false, 'Tune a flywheel with live graphs, then do Lab 4.'],
      ['3.6', 'motion-profiles', 'Motion profiles', 6, false, 'Trapezoid profiles: planning a smooth move from A to B.'],
      ['3.7', 'elevator', 'Profiled elevator', 6, false, 'ProfiledPIDController and ElevatorFeedforward, with Lab 6.'],
      ['3.8', 'arm', 'Profiled arm and the radians trap', 7, false, 'ArmFeedforward, angle-dependent gravity, and the most common units bug, with Lab 7.'],
      ['3.9', 'readiness', 'Readiness triggers', 4, false, 'Telling the rest of the robot that a mechanism has reached its target.'],
      ['3.10', 'enrichment', 'Enrichment: followers, kA, homing', 8, false, 'Follower motors, the acceleration term, a homing routine, and a gravity comparison.'],
      ['3.11', 'sysid', 'SysId characterization', null, true, 'Measuring feedforward constants instead of guessing them.'],
      ['3.12', 'on-motor-control', 'Recognizing on-motor control', null, true, 'Slot configs and Motion Magic, so you can read other teams’ code.'],
    ],
  },
  {
    key: '4', dir: 'quality', label: 'Code Quality and Telemetry', milestone: 'M3',
    blurb: 'Constants, NetworkTables, logging, and reviewing code.',
    lessons: [
      ['4.1', 'constants', 'Constants and naming with units', 5, false, 'No magic numbers, and names that carry their units.'],
      ['4.2', 'networktables', 'NetworkTables', 5, false, 'Tables, topics, publishers, and subscribers, with a live tree explorer.'],
      ['4.3', 'live-tuning', 'Live tuning', 5, false, 'Changing gains while the robot runs.'],
      ['4.4', 'reading-graphs', 'AdvantageScope workflow', 5, false, 'The signals to graph and how to read them.'],
      ['4.5', 'code-review', 'Code review', 5, false, 'A short checklist, practiced on real snippets.'],
      ['4.6', 'logging', 'Logging and replay', null, true, 'Data logs, opening them after a match, and what AdvantageKit adds.'],
      ['4.7', 'unit-tests', 'Unit tests for robot code', null, true, 'What the tests shipped with the labs do and how to run them.'],
    ],
  },
  {
    key: '5', dir: 'actions', label: 'Robot Actions', milestone: 'M3',
    blurb: 'Combining mechanisms into safe, driver-friendly robot actions.',
    lessons: [
      ['5.1', 'composition', 'Command composition', 9, false, 'sequence, parallel, race, deadline, either, until, and timeout, with a builder.'],
      ['5.2', 'waiting', 'Waiting for readiness', 9, false, 'Gating one step on another, and the race condition from Lab 9.'],
      ['5.3', 'controller-design', 'Single-controller design', 9, false, 'Designing bindings around the driver, including mode toggles.'],
      ['5.4', 'default-commands', 'Default commands', 9, false, 'What a mechanism does when nothing else is asking for it.'],
      ['5.5', 'coupled-mechanisms', 'Coupled mechanisms', 10, false, 'Collisions, balance, and thinking in states.'],
      ['5.6', 'arm-on-elevator', 'Arm-on-elevator safety', 10, false, 'Arm-first vs elevator-first moves, with a collision sandbox and Lab 10.'],
      ['5.7', 'state-machines', 'State machines', null, true, 'Another way to organize a superstructure.'],
      ['5.8', 'double-jointed-arm', 'Double-jointed arm', null, true, 'Why two joints are harder than two arms, and how to structure the code.'],
      ['5.9', 'mini-scorer', 'Mini Scorer challenge', 11, false, 'A guide to Lab 11: finishing a partly written robot.'],
      ['5.10', 'week-6-checkpoint', 'Week 6 checkpoint', 12, false, 'A mock checkpoint with the mentor questions and a self-assessment.'],
    ],
  },
  {
    key: '6', dir: 'swerve', label: 'Swerve and Localization', milestone: 'M4',
    blurb: 'Driving a swerve robot and knowing where it is on the field.',
    lessons: [
      ['6.1', 'coordinates', 'Coordinate systems', null, true, 'Field and robot frames, angle direction, and alliance flipping.'],
      ['6.2', 'swerve-model', 'Swerve mental model', 13, false, 'Four steered wheels, ChassisSpeeds, and a driving playground.'],
      ['6.3', 'driving', 'Field-relative driving', 13, false, 'Field vs robot relative, deadband, and input curves.'],
      ['6.4', 'swervegen', 'CTRE SwerveGen', 13, false, 'What the generator writes for you and what you write.'],
      ['6.5', 'pose', 'Pose and odometry', 14, false, 'Pose2d, odometry, and gyro drift.'],
      ['6.6', 'heading-control', 'Reset pose and heading control', 14, false, 'Resetting pose and turning to face a target.'],
    ],
  },
  {
    key: '7', dir: 'vision', label: 'Vision', milestone: 'M4',
    blurb: 'Using cameras and AprilTags to correct position and line up.',
    lessons: [
      ['7.1', 'apriltags', 'AprilTags and PhotonVision', 15, false, 'How a camera turns a tag into numbers.'],
      ['7.2', 'pose-estimation', 'Vision pose estimation', 15, false, 'Transforms, the field layout, ambiguity, and trust.'],
      ['7.3', 'orbitcamera', 'OrbitCamera walkthrough', 15, false, 'Reading the team’s reusable camera class.'],
      ['7.4', 'align-to-tag', 'Align to a tag', 16, false, 'Three PID loops, tolerance, and stopping safely with no target.'],
    ],
  },
  {
    key: '8', dir: 'auto', label: 'Autonomous and Capstone', milestone: 'M4',
    blurb: 'PathPlanner autos that drive and run mechanisms together.',
    lessons: [
      ['8.1', 'pathplanner', 'PathPlanner concepts', 17, false, 'Waypoints, constraints, and rotation targets.'],
      ['8.2', 'autobuilder', 'AutoBuilder', 17, false, 'Connecting PathPlanner to the drivetrain, and alliance flipping.'],
      ['8.3', 'event-markers', 'Event markers', 17, false, 'Firing mechanism commands at points along a path.'],
      ['8.4', 'capstone', 'Capstone guide', 18, false, 'Putting mechanisms, driving, vision, and autos together.'],
      ['8.5', 'workflow', 'Build-season workflow', 18, false, 'From a requirement to tested code on the robot.'],
    ],
  },
  {
    key: '9', dir: 'beyond', label: 'Beyond Training', milestone: 'M4',
    blurb: 'Real robots, competitions, and what changes in 2027.',
    lessons: [
      ['9.1', 'bring-up', 'Real-robot bring-up', null, true, 'A first-enable checklist: device setup, directions, CAN errors, and brownouts.'],
      ['9.2', 'competition', 'Competition readiness', null, true, 'The pit, deploying at events, and reviewing match logs.'],
      ['9.3', 'changes-2027', 'What changes in 2027', null, true, 'SystemCore, Java 25, renamed packages, and Commands v3.'],
      ['9.4', 'reading-code', 'Reading an unfamiliar codebase', 11, false, 'Start at RobotContainer and trace one button.'],
    ],
  },
];

/** Flat list of lessons with their track attached. */
export const lessons = tracks.flatMap((t) =>
  t.lessons.map(([id, slug, title, session, isNew, summary], i) => ({
    id, slug, title, session, isNew, summary, order: i + 1,
    track: t.dir, trackLabel: t.label, milestone: t.milestone, href: `/${t.dir}/${slug}/`,
  })),
);
