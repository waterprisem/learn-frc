/** Relative vs absolute encoder on one mechanism shaft. Angles are degrees. */
export const HOME_ANGLE = 0;

export interface EncoderState {
  /** True shaft angle, 0 to 360. */
  shaft: number;
  /** Shaft angle the relative encoder treats as zero. */
  zero: number;
}

export const initialEncoder = (): EncoderState => ({ shaft: 90, zero: 0 });

const wrap = (a: number) => ((a % 360) + 360) % 360;

export const setShaft = (s: EncoderState, shaft: number): EncoderState => ({ ...s, shaft: wrap(shaft) });

/** Power off and on: the relative encoder forgets and reads 0 here; the absolute one is unaffected. */
export const powerCycle = (s: EncoderState): EncoderState => ({ ...s, zero: s.shaft });

/** Move to the known home mark, then tell the relative encoder "this is 0". */
export const home = (s: EncoderState): EncoderState => ({ shaft: HOME_ANGLE, zero: HOME_ANGLE });

export const relativeReading = (s: EncoderState): number => wrap(s.shaft - s.zero);
export const absoluteReading = (s: EncoderState): number => wrap(s.shaft);

/** Signed degrees (-180..180] by which the relative reading disagrees with the true angle. */
export function relativeError(s: EncoderState): number {
  const e = wrap(relativeReading(s) - (s.shaft - HOME_ANGLE) + 180) - 180;
  return e === -180 ? 180 : e;
}
