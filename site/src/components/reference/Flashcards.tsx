import { useEffect, useMemo, useState } from 'react';
import { dueQueue, grade, mastered, type Deck } from '../../lib/flashcards';
import { useProgress } from '../../stores/progress';

export interface Card {
  id: string;
  term: string;
  short: string;
  lessons: string[];
}

const KEY = 'learn-frc-cards';
const load = (): Deck => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; }
};

/** Glossary terms as spaced-repetition flashcards. Progress stays in this browser. */
export default function Flashcards({ cards }: { cards: Card[] }) {
  const [deck, setDeck] = useState<Deck>({});
  const [ready, setReady] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [finishedOnly, setFinishedOnly] = useState(false);
  const progress = useProgress();

  useEffect(() => { setDeck(load()); setReady(true); }, []);
  const save = (d: Deck) => {
    setDeck(d);
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* private mode: the deck lasts for this visit */ }
  };

  const pool = useMemo(
    () => cards.filter((c) => !finishedOnly || c.lessons.some((l) => progress.lessons[l]?.complete)),
    [cards, finishedOnly, progress],
  );
  const ids = pool.map((c) => c.id);
  const now = Date.now();
  const queue = ready ? dueQueue(ids, deck, now) : [];
  const card = pool.find((c) => c.id === queue[0]);

  function answer(knewIt: boolean) {
    if (!card) return;
    save({ ...deck, [card.id]: grade(deck[card.id], knewIt, Date.now()) });
    setFlipped(false);
  }

  return (
    <div className="lf-playground lf-cards not-content">
      <div className="lf-pg-bar head">
        <span>{queue.length} due · {mastered(ids, deck)} of {ids.length} learned</span>
        <span className="spacer" />
        <label className="lf-check">
          <input type="checkbox" checked={finishedOnly} onChange={(e) => { setFinishedOnly(e.target.checked); setFlipped(false); }} />
          Only lessons I finished
        </label>
      </div>
      {!ready ? null : card ? (
        <>
          <button type="button" className="face" onClick={() => setFlipped(!flipped)} aria-label={flipped ? 'Show the term' : 'Show the definition'}>
            {flipped ? <span className="def">{card.short}</span> : <b>{card.term}</b>}
          </button>
          <div className="lf-pg-bar">
            {flipped ? (
              <>
                <button type="button" onClick={() => answer(false)}>Again</button>
                <button type="button" className="primary" onClick={() => answer(true)}>Got it</button>
              </>
            ) : (
              <button type="button" onClick={() => setFlipped(true)}>Show definition</button>
            )}
          </div>
        </>
      ) : (
        <p className="empty">{ids.length ? 'All caught up. Come back later.' : 'No cards yet. Finish a lesson first.'}</p>
      )}
    </div>
  );
}
