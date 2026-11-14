import { Circle, CircleCheck } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { updateLesson } from '../../stores/progress';

export interface Task {
  label: string;
  done: boolean;
}

/**
 * A short checklist of things to try in a playground. A task stays ticked once it has been done,
 * and finishing all of them ticks the lesson's "Try it" section.
 */
export default function Tasks({ tasks, lessonId }: { tasks: Task[]; lessonId?: string }) {
  const latched = useRef<boolean[]>([]);
  tasks.forEach((t, i) => { if (t.done) latched.current[i] = true; });
  const count = tasks.filter((_, i) => latched.current[i]).length;

  useEffect(() => {
    if (lessonId && count === tasks.length) updateLesson(lessonId, { guideDone: true });
  }, [lessonId, count, tasks.length]);

  return (
    <ol className="lf-tasks" aria-label={`Things to try: ${count} of ${tasks.length} done`}>
      {tasks.map((t, i) => (
        <li key={t.label} className={latched.current[i] ? 'done' : ''}>
          {latched.current[i] ? <CircleCheck size={17} aria-label="Done" /> : <Circle size={17} aria-label="Not done yet" />}
          {t.label}
        </li>
      ))}
    </ol>
  );
}
