/** FRC addressing: 10.TE.AM.X, where TE and AM are the two pairs of the team number's digits. */

export const MAX_TEAM = 25599; // TE and AM must each fit in one 0-255 address number

export type ParsedTeam = { ok: true; team: number; te: number; am: number } | { ok: false; reason: string };

export function parseTeam(text: string): ParsedTeam {
  const t = text.trim();
  if (t === '') return { ok: false, reason: 'Enter a team number.' };
  if (!/^\d{1,5}$/.test(t)) return { ok: false, reason: 'Use 1 to 5 digits.' };
  const team = Number(t);
  if (team < 1) return { ok: false, reason: 'Team numbers start at 1.' };
  if (team > MAX_TEAM) return { ok: false, reason: 'The first pair would pass 255, which is too big for an address number.' };
  return { ok: true, team, te: Math.floor(team / 100), am: team % 100 };
}

export const ip = (te: number, am: number, x: number) => `10.${te}.${am}.${x}`;

export interface DeviceRow {
  device: string;
  address: string;
  note: string;
}

/** Devices from lesson 1.9 and the WPILib networking docs. */
export function deviceTable(team: ParsedTeam & { ok: true }): DeviceRow[] {
  const { te, am } = team;
  return [
    { device: 'Radio', address: ip(te, am, 1), note: 'X = 1' },
    { device: 'roboRIO', address: ip(te, am, 2), note: `also roboRIO-${team.team}-FRC.local` },
    { device: 'Driver Station laptop', address: `${ip(te, am, 20)} to ${ip(te, am, 199)}`, note: 'assigned by the radio' },
  ];
}

/** The four-digit, two-pair way the lesson writes the number. Five-digit teams already have three digits in the first pair. */
export function pairs(team: ParsedTeam & { ok: true }): [string, string] {
  const padded = String(team.team).padStart(4, '0');
  return [padded.slice(0, -2), padded.slice(-2)];
}
