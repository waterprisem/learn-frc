/** A CAN bus with TalonFX motor controllers on it, and what happens when code addresses one by ID. */

export interface CanDevice {
  name: string;
  id: number;
}

export const MAX_CAN_ID = 62;
export const validId = (id: number) => Number.isInteger(id) && id >= 0 && id <= MAX_CAN_ID;

export type SendResult =
  /** Exactly one device has this ID: it obeys. */
  | { kind: 'ok'; index: number }
  /** No device has this ID. Nothing answers, and no exception is thrown. */
  | { kind: 'none' }
  /** Several devices share this ID: none of them can be trusted. */
  | { kind: 'conflict'; indexes: number[] };

/** What happens to a command sent by `new TalonFX(id)`. */
export function send(devices: CanDevice[], id: number): SendResult {
  const indexes = devices.flatMap((d, i) => (d.id === id ? [i] : []));
  if (indexes.length === 0) return { kind: 'none' };
  if (indexes.length === 1) return { kind: 'ok', index: indexes[0] };
  return { kind: 'conflict', indexes };
}

/** IDs that more than one device is using. */
export function duplicateIds(devices: CanDevice[]): number[] {
  const ids = devices.map((d) => d.id);
  return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
}
