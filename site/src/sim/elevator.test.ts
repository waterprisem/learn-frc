import { describe, expect, it } from 'vitest';
import { ElevatorFeedforward } from './control/ElevatorFeedforward';
import { ProfiledPIDController } from './control/ProfiledPIDController';
import { TrapezoidProfile } from './control/TrapezoidProfile';
import { elevatorPresets, standardElevatorSchedule } from './elevatorPresets';
import { ElevatorSim, POSITION_TOLERANCE_METERS, runElevatorScenario, STOW_HEIGHT_METERS } from './elevatorSim';
import { ElevatorPlant } from './plants/elevator';

const run = (id: keyof typeof elevatorPresets, seconds = 6) =>
  runElevatorScenario(elevatorPresets[id].gains, standardElevatorSchedule, seconds);
const maxError = (s: ReturnType<typeof run>) => Math.max(...s.map((x) => Math.abs(x.error)));

describe('TrapezoidProfile (WPILib semantics)', () => {
  const start = { position: 0, velocity: 0 };

  it('matches the worked move in lesson 3.6 (1.0 m/s, 2.0 m/s², 1.0 m)', () => {
    const profile = new TrapezoidProfile({ maxVelocity: 1, maxAcceleration: 2 });
    const goal = { position: 1, velocity: 0 };
    const table = [
      [0.25, 0.0625, 0.5],
      [0.5, 0.25, 1.0],
      [1.0, 0.75, 1.0],
      [1.25, 0.9375, 0.5],
      [1.5, 1.0, 0.0],
    ];
    for (const [t, position, velocity] of table) {
      const s = profile.calculate(t, start, goal);
      expect(s.position).toBeCloseTo(position);
      expect(s.velocity).toBeCloseTo(velocity);
    }
    expect(profile.totalTime()).toBeCloseTo(1.5);
    expect(profile.phases()).toEqual({ endAccel: 0.5, endFullSpeed: 1, endDecel: 1.5 });
  });

  it('becomes a triangle when the move is too short to cruise', () => {
    const profile = new TrapezoidProfile({ maxVelocity: 1, maxAcceleration: 2 });
    const goal = { position: 0.2, velocity: 0 };
    profile.calculate(0, start, goal);
    const { endAccel, endFullSpeed, endDecel } = profile.phases();
    expect(endFullSpeed).toBeCloseTo(endAccel);
    expect(endDecel).toBeCloseTo(0.632, 2);
    expect(profile.calculate(endAccel, start, goal).velocity).toBeCloseTo(Math.sqrt(0.4));
  });

  it('runs downward moves and stays at the goal afterwards', () => {
    const profile = new TrapezoidProfile({ maxVelocity: 1, maxAcceleration: 2 });
    const s = profile.calculate(0.25, { position: 1, velocity: 0 }, start);
    expect(s.position).toBeCloseTo(0.9375);
    expect(s.velocity).toBeCloseTo(-0.5);
    expect(profile.calculate(9, { position: 1, velocity: 0 }, start)).toEqual({ position: 0, velocity: 0 });
  });
});

describe('ProfiledPIDController and ElevatorFeedforward', () => {
  it('measures error against the profiled setpoint, not the goal', () => {
    const pid = new ProfiledPIDController(18, 0, 0, { maxVelocity: 1, maxAcceleration: 2 });
    pid.reset(0, 0);
    const out = pid.calculate(0, 1);
    // One 20 ms step of the profile: ½ × 2 × 0.02² = 0.0004 m
    expect(pid.getSetpoint().position).toBeCloseTo(0.0004);
    expect(pid.getGoal().position).toBe(1);
    expect(out).toBeCloseTo(18 * 0.0004);
    expect(pid.atGoal()).toBe(false);
  });

  it('feedforward is kS·sign(v) + kG + kV·v, and kG alone at rest', () => {
    const ff = new ElevatorFeedforward(0.15, 0.55, 1.1, 0.05);
    expect(ff.calculate(0)).toBeCloseTo(0.55);
    expect(ff.calculate(1)).toBeCloseTo(1.8);
    expect(ff.calculate(-1)).toBeCloseTo(-0.7);
  });
});

describe('ElevatorPlant', () => {
  it('holds still at its gravity voltage and falls to the hard stop at 0 V', () => {
    const plant = new ElevatorPlant({ startHeightMeters: 0.5 });
    for (let i = 0; i < 50; i++) plant.update(plant.gravityVolts, 0.02);
    expect(plant.heightMeters).toBeCloseTo(0.5);
    for (let i = 0; i < 2000; i++) plant.update(0, 0.02); // back-EMF through the 10:1 gearing makes it sink slowly
    expect(plant.heightMeters).toBe(0);
    expect(plant.velocityMetersPerSecond).toBe(0);
  });

  it('settles at (volts − gravity volts) × speed per volt', () => {
    const plant = new ElevatorPlant();
    for (let i = 0; i < 10; i++) plant.update(6, 0.02);
    expect(plant.velocityMetersPerSecond).toBeCloseTo((6 - plant.gravityVolts) * plant.metersPerSecondPerVolt);
    expect(plant.gravityVolts).toBeCloseTo(0.18, 2);
    expect(1 / plant.metersPerSecondPerVolt).toBeCloseTo(8.63, 1);
  });
});

describe('ElevatorSim scenarios', () => {
  it('lab solution: goal jumps, setpoint ramps, height follows and ends At Target', () => {
    const s = run('lab');
    const at = (t: number) => s[Math.round(t / 0.02)];
    expect(at(0.52).goal).toBe(1.05);
    expect(at(0.52).setpoint).toBeLessThan(0.05);
    expect(at(1.5).setpoint).toBeGreaterThan(at(1.5).height);
    const last = s[s.length - 1];
    expect(last.atTarget).toBe(true);
    expect(Math.abs(last.height - 1.05)).toBeLessThan(POSITION_TOLERANCE_METERS);
    // Holding still costs the gravity voltage.
    expect(last.output).toBeCloseTo(0.18, 1);
  });

  it('holds stow before any button is pressed', () => {
    const s = run('lab', 0.4);
    expect(Math.abs(s[s.length - 1].height - STOW_HEIGHT_METERS)).toBeLessThan(POSITION_TOLERANCE_METERS);
  });

  it('a lower max velocity makes the profile take longer', () => {
    const arrival = (id: 'lab' | 'slow') => run(id).find((x) => x.setpoint === 1.05)!.t;
    expect(arrival('slow')).toBeGreaterThan(arrival('lab') + 1);
  });

  it('without kG the height lags further behind during the move', () => {
    expect(maxError(run('kg-zero'))).toBeGreaterThan(maxError(run('lab')) + 0.02);
  });

  it('matched feedforward keeps the error small for the whole move', () => {
    expect(maxError(run('matched'))).toBeLessThan(0.05);
    expect(maxError(run('lab'))).toBeGreaterThan(0.2);
  });

  it('gains at zero: no output, and the carriage sinks to the bottom', () => {
    const last = run('zero').at(-1)!;
    expect(last.output).toBe(0);
    expect(last.height).toBe(0);
  });

  it('kP far too large never settles: the output keeps slamming between the rails', () => {
    const tail = run('kp-high').slice(-50);
    expect(Math.max(...tail.map((x) => x.output)) - Math.min(...tail.map((x) => x.output))).toBeGreaterThan(6);
  });

  it('a new target restarts the profile from the measured height', () => {
    const sim = new ElevatorSim(elevatorPresets.lab.gains);
    for (let i = 0; i < 60; i++) sim.step(1.05);
    const mid = sim.step(1.05);
    const next = sim.step(0.18);
    expect(next.goal).toBe(0.18);
    expect(Math.abs(next.setpoint - mid.height)).toBeLessThan(0.05);
  });
});
