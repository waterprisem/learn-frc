import { Circle, CircleCheck, CircleDot } from 'lucide-react';
import { useEffect, useState } from 'react';
import { updateLesson, useLessonProgress } from '../../stores/progress';

export interface Section { slug: string; text: string }

/** How a section gets ticked off, worked out from its heading. */
function kindOf(slug: string): 'guide' | 'quiz' | 'rating' | 'read' {
  if (slug.startsWith('try-it')) return 'guide';
  if (slug === 'practice') return 'quiz';
  if (slug === 'checkpoint') return 'rating';
  return 'read';
}
const HOW = { guide: 'Finish the guided steps', quiz: 'Get every question right', rating: 'Rate yourself', read: 'Read through it' };

/**
 * Replaces "On this page" on lesson pages: a progress bar and a checklist of the lesson's sections.
 * Reading sections tick when you scroll through them; activity sections tick when you complete them.
 */
export default function LessonProgress({ lessonId, sections }: { lessonId: string; sections: Section[] }) {
  const progress = useLessonProgress(lessonId);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    let queued = false;
    const measure = () => {
      queued = false;
      const tops = sections.map((s) => document.getElementById(s.slug)?.getBoundingClientRect().top ?? Infinity);
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let now: string | null = null;
      const seen = new Set(progress.seen ?? []);
      const before = seen.size;
      sections.forEach((s, i) => {
        if (tops[i] < 140) now = s.slug;
        // A reading section counts once the next section's heading has come into the upper part of the screen.
        const nextTop = i + 1 < sections.length ? tops[i + 1] : atBottom ? 0 : Infinity;
        if (kindOf(s.slug) === 'read' && nextTop < window.innerHeight * 0.6) seen.add(s.slug);
      });
      setCurrent(now);
      if (seen.size !== before) updateLesson(lessonId, { seen: [...seen] });
    };
    const onScroll = () => {
      if (!queued) { queued = true; requestAnimationFrame(measure); }
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [lessonId, sections, progress.seen]);

  const isDone = (slug: string) => {
    const kind = kindOf(slug);
    if (kind === 'guide') return !!progress.guideDone;
    if (kind === 'quiz') return !!progress.quiz && progress.quiz.correct === progress.quiz.total;
    if (kind === 'rating') return !!progress.rating;
    return (progress.seen ?? []).includes(slug);
  };
  const done = sections.filter((s) => isDone(s.slug)).length;
  const percent = sections.length ? Math.round((done / sections.length) * 100) : 0;

  return (
    <nav className="lf-progress" aria-labelledby="lf-progress-title">
      <h2 id="lf-progress-title">Lesson progress</h2>
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={sections.length} aria-valuenow={done} aria-label={`${done} of ${sections.length} sections done`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="count">{done === sections.length ? 'Lesson complete' : `${done} of ${sections.length} done`}</p>
      <ol>
        {sections.map((s) => {
          const ok = isDone(s.slug);
          const here = current === s.slug;
          const Icon = ok ? CircleCheck : here ? CircleDot : Circle;
          const kind = kindOf(s.slug);
          return (
            <li key={s.slug} className={`${ok ? 'done' : ''}${here ? ' here' : ''}`}>
              <a href={`#${s.slug}`} aria-current={here ? 'location' : undefined} title={ok ? 'Done' : HOW[kind]}>
                <Icon size={16} aria-hidden="true" />
                <span>
                  {s.text}
                  {kind === 'quiz' && progress.quiz && !ok && <small> {progress.quiz.correct}/{progress.quiz.total}</small>}
                  <span className="sr-only">{ok ? ' (done)' : ` (to do: ${HOW[kind]})`}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
