import type { FlywheelGains, FlywheelSample } from '../../sim/flywheelSim';

/** What the coach can see each frame. */
export interface GuideContext {
  gains: FlywheelGains;
  target: number | null;
  load: boolean;
  latest: FlywheelSample | undefined;
  /** Seconds the current button has been held (or released). */
  heldFor: number;
  /** Velocity has stopped changing (within 0.5 RPS over the last second). */
  settled: boolean;
  /** Velocity keeps reversing direction (sustained swinging around the target). */
  oscillating: boolean;
}

/** Work out what the coach sees from the recent telemetry. */
export function buildGuideContext(
  samples: FlywheelSample[], gains: FlywheelGains, target: number | null, load: boolean, heldFor: number,
): GuideContext {
  const recent = samples.slice(-50).map((x) => x.velocity);
  const swing = recent.length ? Math.max(...recent) - Math.min(...recent) : 0;
  let reversals = 0;
  for (let i = 2; i < recent.length; i++) {
    if ((recent[i] - recent[i - 1]) * (recent[i - 1] - recent[i - 2]) < 0) reversals++;
  }
  return {
    gains, target, load, heldFor,
    latest: samples[samples.length - 1],
    settled: recent.length >= 50 && swing < 0.5,
    oscillating: reversals >= 4 && swing > 2,
  };
}

export interface GuideResult {
  done: boolean;
  tone: 'info' | 'good' | 'warn';
  /** Feedback on what the learner is doing right now. Backticks mark code. */
  note: string;
}

export interface GuideStep {
  title: string;
  goal: string;
  /** `memo` persists for the step so it can remember what it has already seen. */
  evaluate(c: GuideContext, memo: Record<string, any>): GuideResult;
}

const info = (note: string): GuideResult => ({ done: false, tone: 'info', note });
const warn = (note: string): GuideResult => ({ done: false, tone: 'warn', note });
const good = (note: string): GuideResult => ({ done: true, tone: 'good', note });
const n = (v: number) => Math.abs(v).toFixed(1);

/** The Lab 4 tuning procedure, one checked step at a time. */
export const flywheelGuide: GuideStep[] = [
  {
    title: 'Start from zero',
    goal: 'Press **B** to ask for 40 RPS and watch the graph.',
    evaluate(c) {
      const { kS, kV, kP, kI, kD } = c.gains;
      if (kS || kV || kP || kI || kD) return warn('Set every gain back to 0 first (choose the **All zeros** preset).');
      if (c.target === null) return info('Press **B**. The dashed Target line will jump to 40.');
      if (c.heldFor < 1) return info('Watch the Output Voltage line…');
      return good('Target jumped to 40, but Output Voltage stays at 0 V. Every gain is 0, so the code asks the motor for nothing.');
    },
  },
  {
    title: 'Tune kS',
    goal: 'Keep **B** held. Raise `kS` slowly until the wheel only just starts to turn.',
    evaluate(c) {
      if (c.target === null) return info('Hold **B** so the controller is running.');
      if (c.gains.kV || c.gains.kP) return warn('Leave `kV` and `kP` at 0 for this step so you only see what `kS` does.');
      const v = c.latest?.velocity ?? 0;
      if (v < 0.05) return info(c.gains.kS ? 'Not moving yet. Friction is still winning, so go a little higher.' : 'Drag the `kS` slider up a little at a time.');
      if (c.gains.kS > 0.4) return warn('It turns, but that is more than friction needs. Bring `kS` down until the wheel barely creeps (about 0.2).');
      return good(`The wheel is creeping at ${n(v)} RPS. That is all \`kS\` is for: just enough voltage to beat friction.`);
    },
  },
  {
    title: 'Tune kV',
    goal: 'Raise `kV` until Velocity sits on Target. Then check **A** and **Y** too.',
    evaluate(c, memo) {
      if (memo.kV !== c.gains.kV) { memo.kV = c.gains.kV; memo.ok = {}; }
      if (c.gains.kP) return warn('Keep `kP` at 0 here, so you see what feedforward does by itself.');
      if (c.target === null) return info('Hold a button. Start with **B**.');
      if (!c.settled || c.heldFor < 1.5) return info('Let the speed settle…');
      const e = c.latest?.error ?? 0;
      if (e > 2) return info(`Velocity settles ${n(e)} RPS below Target, so \`kV\` is too small. Raise it.`);
      if (e < -2) return warn(`Velocity settles ${n(e)} RPS above Target, so \`kV\` is too large. Lower it.`);
      memo.ok[c.target] = true;
      const left = [['A', 20], ['B', 40], ['Y', 70]].filter(([, t]) => !memo.ok[t as number]).map(([b]) => `**${b}**`);
      if (left.length) return info(`On target at ${c.target} RPS. A good \`kV\` works at every speed, so now hold ${left.join(' and ')}.`);
      return good('Feedforward alone lands within 2 RPS at all three speeds. Most of the work is already done.');
    },
  },
  {
    title: 'Add kP',
    goal: 'Set `kP` to about 0.08, then hold a button again.',
    evaluate(c) {
      if (!c.gains.kP) return info('Give `kP` a small value. Type 0.08 in its box.');
      if (c.target === null) return info('Hold a button to see the response.');
      if (c.oscillating) return warn('The speed is swinging around the target. That `kP` is too large; bring it down.');
      if (c.gains.kP > 0.5) return warn('That is a lot of `kP`. Feedforward already does most of the work, so try about 0.08.');
      if (!c.latest?.atTarget || c.heldFor < 1.2) return info('Watch the Error line head to zero…');
      return good('At Target is true. PID now trims whatever error feedforward leaves behind.');
    },
  },
  {
    title: 'Break it on purpose',
    goal: 'Hold **B**. First cut `kV` in half and let it settle. Then put it back and push `kP` above 2.',
    evaluate(c, memo) {
      if (c.target === null) return info('Hold **B** first.');
      const e = c.latest?.error ?? 0;
      if (c.gains.kV <= 0.08 && c.settled && c.heldFor > 1.5 && e > 4) memo.low = true;
      if (c.gains.kP >= 1.5 && c.oscillating) memo.osc = true;
      if (memo.low && memo.osc) return good('You have seen both classic problems: a steady gap (`kV` too small) and swinging (`kP` too large). Choose the **Tuned** preset to recover.');
      if (!memo.low) return info(c.gains.kV <= 0.08 ? 'Let it settle and look at the gap between Velocity and Target.' : 'Lower `kV` to about 0.06.');
      return info(c.gains.kP >= 1.5 ? 'Watch Velocity and Output Voltage swing.' : `Steady gap seen: ${n(e)} RPS that a modest \`kP\` cannot close. Now restore \`kV\` to 0.12 and raise \`kP\` above 2.`);
    },
  },
  {
    title: 'Fight a load',
    goal: 'Choose **Tuned**, hold **B**, and tick **Add a load**. Set `kP` to 0, let it settle, then raise `kP`.',
    evaluate(c, memo) {
      if (c.target === null) return info('Hold **B** first.');
      if (!c.load) return info('Tick **Add a load** under the gains.');
      const e = Math.abs(c.latest?.error ?? 0);
      if (!c.gains.kP) {
        if (c.settled && c.heldFor > 1.5 && e > 2) { memo.ff = e; return info(`Feedforward alone misses by ${n(e)} RPS and Output Voltage stays flat. It never looks at the encoder. Now raise \`kP\`.`); }
        return info('Let it settle with `kP` at 0.');
      }
      if (!memo.ff) return info('Set `kP` to 0 first, so you can see feedforward alone against the load.');
      if (c.oscillating) return warn('Too much: it is swinging now. Back `kP` off.');
      if (c.settled && e < memo.ff * 0.75) return good(`Error shrank from ${n(memo.ff)} to ${n(e)} RPS. Feedback reacts to what actually happened; that is why the lab uses both.`);
      return info('Keep raising `kP` and watch the error shrink.');
    },
  },
];
