import { useSyncExternalStore } from 'react';

/** Per-lesson progress, kept in this browser only. */
export interface LessonProgress {
  quiz?: { correct: number; total: number };
  rating?: 'green' | 'yellow' | 'red';
  /** Slugs of reading sections the learner has scrolled through. */
  seen?: string[];
  /** The playground's guided steps were completed. */
  guideDone?: boolean;
}
type State = { version: 1; lessons: Record<string, LessonProgress> };

const KEY = 'learn-frc-progress';
const empty: State = { version: 1, lessons: {} };
const listeners = new Set<() => void>();
let cache: State | null = null;

function read(): State {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    cache = parsed?.version === 1 ? (parsed as State) : empty;
  } catch {
    cache = empty; // storage blocked or corrupt: start fresh, in memory only
  }
  return cache;
}

export function updateLesson(id: string, patch: LessonProgress): void {
  const state = read();
  cache = { ...state, lessons: { ...state.lessons, [id]: { ...state.lessons[id], ...patch } } };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Not saved; progress still shows for this visit.
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const none: LessonProgress = {};

export function useLessonProgress(id: string): LessonProgress {
  return useSyncExternalStore(subscribe, () => read().lessons[id] ?? none, () => none);
}
