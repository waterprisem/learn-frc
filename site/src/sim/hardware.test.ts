import { describe, expect, it } from 'vitest';
import { duplicateIds, send, validId } from './can/bus';
import { CAN_CHAIN, faultEffects, wires } from './hardware/controlSystem';
import { batteries, BROWNOUT_VOLTS, PowerSim, settledVolts, terminalVolts } from './power/battery';

describe('control-system faults', () => {
  it('has one wire per connection with unique ids', () => {
    expect(new Set(wires.map((w) => w.id)).size).toBe(wires.length);
    expect(wires.filter((w) => w.layer === 'can')).toHaveLength(CAN_CHAIN.length - 1);
  });

  it('kills everything when the main power path breaks', () => {
    const fx = faultEffects('power:breaker-pdh');
    expect(fx.off).toEqual(expect.arrayContaining(['pdh', 'roborio', 'kraken1', 'radio', 'camera']));
    expect(fx.off).not.toContain('battery');
    expect(fx.effects).toHaveLength(1);
  });

  it('turns off only the device whose power wire broke', () => {
    expect(faultEffects('power:pdh-kraken2').off).toEqual(['kraken2']);
    expect(faultEffects('power:pdh-coprocessor').off).toEqual(['coprocessor', 'camera']);
  });

  it('loses every CAN device past the break', () => {
    const fx = faultEffects('can:kraken1-kraken2');
    expect(fx.lost).toEqual(['kraken2', 'cancoder', 'pigeon', 'pdh']);
    expect(fx.off).toEqual([]);
    expect(faultEffects('can:pigeon-pdh').lost).toEqual(['pdh']);
  });

  it('cuts the driver off when the network path to the laptop breaks', () => {
    expect(faultEffects('network:roborio-radio').lost).toContain('ds');
    expect(faultEffects('network:radio-coprocessor').lost).toEqual(['coprocessor', 'camera']);
  });

  it('describes every fault', () => {
    for (const w of wires) expect(faultEffects(w.id).effects.length).toBeGreaterThan(0);
    expect(faultEffects('nope').effects).toEqual([]);
  });
});

describe('battery and brownout', () => {
  it('sags by current times internal resistance', () => {
    expect(terminalVolts({ restVolts: 12.7, internalOhms: 0.02 }, 200)).toBeCloseTo(8.7);
  });

  it('holds up with a sensible current limit and browns out without one', () => {
    expect(settledVolts(batteries.fresh, 4, 40)).toBeGreaterThan(BROWNOUT_VOLTS);
    expect(settledVolts(batteries.fresh, 4, 120)).toBeLessThan(BROWNOUT_VOLTS);
    expect(settledVolts(batteries.tired, 6, 40)).toBeLessThan(settledVolts(batteries.fresh, 6, 40));
  });

  it('stutters: brownout cuts the motors, voltage recovers, motors return', () => {
    const sim = new PowerSim();
    const input = { battery: batteries.fresh, motors: 6, limitAmps: 100, pushing: true };
    let flips = 0;
    let was = false;
    for (let i = 0; i < 250; i++) {
      const s = sim.step(input);
      if (s.brownout !== was) flips++;
      was = s.brownout;
    }
    expect(flips).toBeGreaterThan(4);
  });

  it('never browns out below the limit that keeps the settled voltage up', () => {
    const sim = new PowerSim();
    for (let i = 0; i < 250; i++) {
      expect(sim.step({ battery: batteries.fresh, motors: 4, limitAmps: 40, pushing: true }).brownout).toBe(false);
    }
  });
});

describe('CAN IDs', () => {
  const bus = [{ name: 'Intake', id: 4 }, { name: 'Shooter', id: 5 }, { name: 'Elevator', id: 6 }];

  it('delivers a command to the one device with that ID', () => {
    expect(send(bus, 5)).toEqual({ kind: 'ok', index: 1 });
  });

  it('delivers to nobody when no device has the ID', () => {
    expect(send(bus, 7)).toEqual({ kind: 'none' });
  });

  it('reports a conflict when two devices share the ID', () => {
    const clash = [bus[0], { name: 'Shooter', id: 4 }, bus[2]];
    expect(send(clash, 4)).toEqual({ kind: 'conflict', indexes: [0, 1] });
    expect(duplicateIds(clash)).toEqual([4]);
    expect(duplicateIds(bus)).toEqual([]);
  });

  it('accepts IDs 0 to 62 only', () => {
    expect([0, 62].every(validId)).toBe(true);
    expect([-1, 63, 1.5, NaN].some(validId)).toBe(false);
  });
});
