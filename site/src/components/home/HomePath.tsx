import { Activity, ArrowRight, Blocks, BookOpen, Camera, ChevronDown, CircleCheck, Cpu, Gauge, Navigation, Rocket, Route, Terminal, Wrench } from 'lucide-react';
import { useProgress } from '../../stores/progress';

export interface HomeLesson { id: string; title: string; href: string; ready: boolean; isNew: boolean }
export interface HomeTrack { key: string; label: string; blurb: string; lessons: HomeLesson[] }
export interface HomeStage { title: string; blurb: string; tracks: HomeTrack[] }

const icons: Record<string, typeof Cpu> = {
  '0': BookOpen, '1': Cpu, R: Wrench, '2': Terminal, '3': Activity, '4': Gauge,
  '5': Blocks, '6': Navigation, '7': Camera, '8': Route, '9': Rocket,
};

/** Home page: one "continue" card, then the path in three stages with tracks that open on click. */
export default function HomePath({ stages }: { stages: HomeStage[] }) {
  const { lessons: saved, last } = useProgress();
  const all = stages.flatMap((s) => s.tracks.flatMap((t) => t.lessons));
  const isComplete = (id: string) => !!saved[id]?.complete;
  const lastLesson = all.find((l) => l.id === last && l.ready);
  const next = lastLesson && !isComplete(lastLesson.id) ? lastLesson : all.find((l) => l.ready && !isComplete(l.id));
  const resuming = !!lastLesson && next === lastLesson;
  const readyCount = all.filter((l) => l.ready).length;
  const doneCount = all.filter((l) => isComplete(l.id)).length;

  return (
    <div className="lf-home not-content">
      <section className="continue" aria-label="Continue learning">
        <div>
          <small>{resuming ? 'Continue where you left off' : next ? 'Start here' : 'All available lessons done'}</small>
          <strong>{next ? `${next.id} ${next.title}` : 'More lessons are on the way.'}</strong>
          <span>{doneCount} of {readyCount} available {readyCount === 1 ? 'lesson' : 'lessons'} complete · {all.length} planned</span>
        </div>
        {next && (
          <a className="go" href={next.href}>{resuming ? 'Continue' : 'Start'}<ArrowRight size={16} aria-hidden="true" /></a>
        )}
      </section>

      {stages.map((stage, si) => (
        <section key={stage.title} className="stage">
          <h2><span className="step">{si + 1}</span>{stage.title}</h2>
          <p className="stage-blurb">{stage.blurb}</p>
          {stage.tracks.map((t) => {
            const Icon = icons[t.key] ?? BookOpen;
            const ready = t.lessons.filter((l) => l.ready).length;
            const done = t.lessons.filter((l) => isComplete(l.id)).length;
            return (
              <details key={t.key} className="track">
                <summary>
                  <span className="track-icon"><Icon size={18} aria-hidden="true" /></span>
                  <span className="text">
                    <b>{t.label}</b>
                    <span>{t.blurb}</span>
                  </span>
                  <span className="meta">
                    {ready ? `${done}/${ready} done` : 'Coming soon'}
                    <small>{t.lessons.length} lessons</small>
                  </span>
                  <ChevronDown size={18} aria-hidden="true" className="chev" />
                </summary>
                <ol>
                  {t.lessons.map((l) => (
                    <li key={l.id} className={l.ready ? 'ready' : 'soon'}>
                      <span className="num">{l.id}</span>
                      {l.ready ? <a href={l.href}>{l.title}</a> : <span>{l.title}</span>}
                      {isComplete(l.id) && <CircleCheck size={15} className="ok" aria-label="Complete" />}
                      {!l.ready && <span className="tag">soon</span>}
                      {l.isNew && <span className="tag">extra</span>}
                    </li>
                  ))}
                </ol>
              </details>
            );
          })}
        </section>
      ))}
    </div>
  );
}
