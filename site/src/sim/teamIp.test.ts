import { describe, expect, it } from 'vitest';
import { deviceTable, pairs, parseTeam } from './teamIp';

function ok(text: string) {
  const p = parseTeam(text);
  if (!p.ok) throw new Error(p.reason);
  return p;
}

describe('team number to IP', () => {
  it('matches the lesson table', () => {
    expect(deviceTable(ok('1360'))[1].address).toBe('10.13.60.2');
    expect(deviceTable(ok('254'))[1].address).toBe('10.2.54.2');
    expect(deviceTable(ok('9999'))[1].address).toBe('10.99.99.2');
  });

  it('handles 1 and 5 digits', () => {
    expect(deviceTable(ok('5'))[0].address).toBe('10.0.5.1');
    expect(deviceTable(ok('10001'))[1].address).toBe('10.100.1.2');
    expect(deviceTable(ok('1305'))[1].address).toBe('10.13.5.2');
  });

  it('pads to pairs for display', () => {
    expect(pairs(ok('254'))).toEqual(['02', '54']);
    expect(pairs(ok('10001'))).toEqual(['100', '01']);
  });

  it('rejects bad input', () => {
    for (const t of ['', 'abc', '0', '123456', '25600', '-5', '12.5']) expect(parseTeam(t).ok).toBe(false);
  });
});
