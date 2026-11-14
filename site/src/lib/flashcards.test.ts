import { describe, expect, it } from 'vitest';
import { BOX_DAYS, DAY_MS, dueQueue, grade, isDue, mastered, type Deck } from './flashcards';

const NOW = 1_000_000_000_000;

describe('flashcards', () => {
  it('a new card is due', () => expect(isDue(undefined, NOW)).toBe(true));
  it('"Got it" moves up a box and waits that many days', () => {
    const a = grade(undefined, true, NOW);
    expect(a).toEqual({ box: 1, due: NOW + BOX_DAYS[1] * DAY_MS });
    expect(isDue(a, NOW + 0.5 * DAY_MS)).toBe(false);
    expect(isDue(a, NOW + DAY_MS)).toBe(true);
  });
  it('"Again" goes back to the first box, due now', () => {
    expect(grade({ box: 4, due: NOW }, false, NOW)).toEqual({ box: 0, due: NOW });
  });
  it('the top box is the cap', () => {
    expect(grade({ box: BOX_DAYS.length - 1, due: 0 }, true, NOW).box).toBe(BOX_DAYS.length - 1);
  });
  it('queues only due cards and counts mastered ones', () => {
    const deck: Deck = { a: { box: 4, due: NOW + 10 * DAY_MS }, b: { box: 1, due: NOW - 1 } };
    expect(dueQueue(['a', 'b', 'c'], deck, NOW)).toEqual(['c', 'b']);
    expect(mastered(['a', 'b', 'c'], deck)).toBe(1);
  });
});
