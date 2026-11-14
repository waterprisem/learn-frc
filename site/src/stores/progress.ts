import { useSyncExternalStore } from 'react';

/** Per-lesson progress, kept in this browser only. */
export interface LessonProgress {
  quiz?: { correct: number; total: number };
  rating?: 'green' | 'yellow' | 'red';
  /** Slugs of reading sections the learner has scrolled through. */
  seen?: string[];
  /** The playground's guided steps were completed. */
  guideDone?: boolean;
  /** Sections the learner ticked or un-ticked by hand. These win over the automatic checks. */
  manual?: Record<string, boolean>;
  /** Every section of the lesson is ticked. */
  complete?: boolean;
}
export interface ProgressState {
  version: 1;
  lessons: Record<string, LessonProgress>;
  /** The lesson opened most recently. */
  last?: string;
}

const KEY = 'learn-frc-progress';
const empty: ProgressState = { version: 1, lessons: {} };
const listeners = new Set<() => void>();
let cache: ProgressState | null = null;

function read(): ProgressState {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    cache = parsed?.version === 1 ? (parsed as ProgressState) : empty;
  } catch {
    cache = empty; // storage blocked or corrupt: start fresh, in memory only
  }
  return cache;
}

function write(next: ProgressState): void {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Not saved; progress still shows for this visit.
  }
  listeners.forEach((l) => l());
}

export function updateLesson(id: string, patch: LessonProgress): void {
  const state = read();
  write({ ...state, lessons: { ...state.lessons, [id]: { ...state.lessons[id], ...patch } } });
}

/** Forget everything recorded for one lesson. */
export function resetLesson(id: string): void {
  const state = read();
  const { [id]: _removed, ...rest } = state.lessons;
  write({ ...state, lessons: rest });
}

export function setLastLesson(id: string): void {
  const state = read();
  if (state.last !== id) write({ ...state, last: id });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const none: LessonProgress = {};

export function useLessonProgress(id: string): LessonProgress {
  return useSyncExternalStore(subscribe, () => read().lessons[id] ?? none, () => none);
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, read, () => empty);
}
