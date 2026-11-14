/** Leitner-box scheduling for the glossary flashcards. Pure functions; the UI keeps the state in localStorage. */
export const BOX_DAYS = [0, 1, 3, 7, 14, 30];
export const DAY_MS = 86_400_000;

export interface CardState {
  box: number; // 0 to BOX_DAYS.length - 1
  due: number; // ms since epoch
}

export type Deck = Record<string, CardState>;

/** A card never seen before is due now. */
export const isDue = (c: CardState | undefined, now: number): boolean => !c || c.due <= now;

/** "Got it" moves a card up a box and waits longer; "Again" sends it back to the first box, due now. */
export function grade(c: CardState | undefined, knewIt: boolean, now: number): CardState {
  const box = knewIt ? Math.min((c?.box ?? 0) + 1, BOX_DAYS.length - 1) : 0;
  return { box, due: knewIt ? now + BOX_DAYS[box] * DAY_MS : now };
}

/** Due cards first, new ones before old ones that were missed, in a stable order. */
export function dueQueue(ids: string[], deck: Deck, now: number): string[] {
  return ids.filter((id) => isDue(deck[id], now)).sort((a, b) => (deck[a]?.due ?? -1) - (deck[b]?.due ?? -1));
}

export const mastered = (ids: string[], deck: Deck): number => ids.filter((id) => (deck[id]?.box ?? 0) >= 4).length;
