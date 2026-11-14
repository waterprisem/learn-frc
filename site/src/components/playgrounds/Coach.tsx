import { ChevronLeft, ChevronRight, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { GuideContext, GuideStep } from './flywheelGuide';

/** **bold** and `code` in coach text. */
function rich(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((p, i) =>
    p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p.startsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : p,
  );
}

interface Props {
  steps: GuideStep[];
  context: GuideContext;
  icon: ReactNode;
  onFinish?: () => void;
}

/**
 * A step-by-step guide that watches the playground and says whether each step is done.
 * Once a step passes it stays passed, so later tinkering never takes the tick away.
 */
export default function Coach({ steps, context, icon, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const memos = useRef<Record<number, Record<string, any>>>({});
  const passed = useRef<Record<number, string>>({});

  const step = steps[index];
  const result = step.evaluate(context, (memos.current[index] ??= {}));
  if (result.done && !passed.current[index]) passed.current[index] = result.note;
  const done = index in passed.current;
  const note = done ? passed.current[index] : result.note;
  const tone = done ? 'good' : result.tone;
  const last = index === steps.length - 1;

  useEffect(() => {
    if (finished && steps.every((_, i) => i in passed.current)) onFinish?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const ToneIcon = tone === 'good' ? CircleCheck : tone === 'warn' ? TriangleAlert : Info;

  return (
    <section className="lf-coach" aria-label="Guided steps">
      <header>
        <span className="who">{icon} Guide</span>
        <ol className="dots" aria-label={`Step ${index + 1} of ${steps.length}`}>
          {steps.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className={`${i === index ? 'current' : ''}${i in passed.current ? ' done' : ''}`}
                aria-label={`Step ${i + 1}: ${s.title}${i in passed.current ? ' (done)' : ''}`}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => { setIndex(i); setFinished(false); }}
              >
                {i + 1}
              </button>
            </li>
          ))}
        </ol>
      </header>

      {finished ? (
        <div className="body">
          <h4>All {steps.length} steps done</h4>
          <p className="goal">You tuned the flywheel in the same order the lab uses. Keep experimenting here, or carry on to the code.</p>
        </div>
      ) : (
        <div className="body">
          <h4>Step {index + 1}: {step.title}</h4>
          <p className="goal">{rich(step.goal)}</p>
          <p className={`note ${tone}`} role="status">
            <ToneIcon size={17} aria-hidden="true" />
            <span>{rich(note)}</span>
          </p>
        </div>
      )}

      <footer>
        <button type="button" disabled={index === 0 && !finished} onClick={() => (finished ? setFinished(false) : setIndex(index - 1))}>
          <ChevronLeft size={15} aria-hidden="true" />Back
        </button>
        {!finished && (
          <>
            {!done && (
              <button type="button" className="skip" onClick={() => (last ? setFinished(true) : setIndex(index + 1))}>Skip</button>
            )}
            <button type="button" className="primary" disabled={!done} onClick={() => (last ? setFinished(true) : setIndex(index + 1))}>
              {last ? 'Finish' : 'Next'}<ChevronRight size={15} aria-hidden="true" />
            </button>
          </>
        )}
      </footer>
    </section>
  );
}
