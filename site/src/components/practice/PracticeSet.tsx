import { ChevronLeft, ChevronRight, CircleCheck, CircleX } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { flywheelPresets, STANDARD_SECONDS, standardSchedule, type FlywheelPresetId } from '../../sim/flywheelPresets';
import { runScenario } from '../../sim/flywheelSim';
import { updateLesson } from '../../stores/progress';
import Chart from '../viz/Chart';
import { flywheelBand, flywheelSeries } from '../viz/flywheelSeries';

type Base = { prompt: string; explain: string; source?: string };
export type PracticeItem =
  | (Base & { type: 'mcq'; choices: string[]; answer: number })
  | (Base & { type: 'read-graph'; preset: string; choices: string[]; answer: number })
  | (Base & { type: 'predict-graph'; presets: string[]; answer: number })
  | (Base & { type: 'symptom-cause'; symptom: string; choices: string[]; answer: number })
  | (Base & { type: 'multi'; choices: string[]; answers: number[] })
  | (Base & { type: 'fill-blank'; code: string; blanks: string[][] })
  | (Base & { type: 'free'; modelAnswer: string })
  | (Base & { type: string });

/** Inline `code` in prompts and explanations. */
function rich(text: string): ReactNode {
  return text.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
}

/** A graph for a practice item. Preset format: "flywheel:<preset id>" with an optional "+load". */
function PresetChart({ preset }: { preset: string }) {
  const data = useMemo(() => {
    const [, id = 'tuned'] = preset.split(':');
    const [name, load] = id.split('+');
    const gains = flywheelPresets[name as FlywheelPresetId]?.gains ?? flywheelPresets.tuned.gains;
    return runScenario(gains, standardSchedule, STANDARD_SECONDS, load ? 0.5 : 0);
  }, [preset]);
  return (
    <Chart data={data as never} series={flywheelSeries} band={flywheelBand} leftLabel="RPS" rightLabel="volts" compact
      ariaLabel="Graph of target, velocity, error and output voltage for a 40 RPS target" />
  );
}

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

function Item({ item, n, hidden, onResult }: { item: PracticeItem; n: number; hidden: boolean; onResult: (ok: boolean) => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [text, setText] = useState<string[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);

  const finish = (ok: boolean) => {
    setResult(ok);
    onResult(ok);
  };
  const choose = (i: number) => {
    setPick(i);
    setResult(null);
  };

  let body: ReactNode;
  let check: (() => void) | null = null;
  let ready = false;

  if ('choices' in item && 'answer' in item) {
    const it = item as Extract<PracticeItem, { type: 'mcq' }>;
    ready = pick !== null;
    check = () => finish(pick === it.answer);
    body = (
      <>
        {'preset' in item && <PresetChart preset={(item as { preset: string }).preset} />}
        {'symptom' in item && <p className="symptom"><b>Symptom.</b> {rich((item as { symptom: string }).symptom)}</p>}
        <div className="lf-choices" role="radiogroup" aria-label={`Question ${n} choices`}>
          {it.choices.map((c, i) => (
            <label key={i} className={pick === i ? 'picked' : ''}>
              <input type="radio" name={`q${n}`} checked={pick === i} onChange={() => choose(i)} />
              <span>{rich(c)}</span>
            </label>
          ))}
        </div>
      </>
    );
  } else if (item.type === 'multi') {
    const it = item as Extract<PracticeItem, { type: 'multi' }>;
    ready = picks.length > 0;
    check = () => finish(picks.length === it.answers.length && it.answers.every((a) => picks.includes(a)));
    body = (
      <div className="lf-choices" role="group" aria-label={`Question ${n} choices (select all that apply)`}>
        {it.choices.map((c, i) => (
          <label key={i} className={picks.includes(i) ? 'picked' : ''}>
            <input
              type="checkbox" checked={picks.includes(i)}
              onChange={() => { setPicks(picks.includes(i) ? picks.filter((p) => p !== i) : [...picks, i]); setResult(null); }}
            />
            <span>{rich(c)}</span>
          </label>
        ))}
      </div>
    );
  } else if (item.type === 'predict-graph') {
    const it = item as Extract<PracticeItem, { type: 'predict-graph' }>;
    ready = pick !== null;
    check = () => finish(pick === it.answer);
    body = (
      <div className="lf-graph-choices" role="radiogroup" aria-label={`Question ${n} graphs`}>
        {it.presets.map((p, i) => (
          <label key={i} className={pick === i ? 'picked' : ''}>
            <span className="tag">
              <input type="radio" name={`q${n}`} checked={pick === i} onChange={() => choose(i)} /> Graph {'ABCDEF'[i]}
            </span>
            <PresetChart preset={p} />
          </label>
        ))}
      </div>
    );
  } else if (item.type === 'fill-blank') {
    const it = item as Extract<PracticeItem, { type: 'fill-blank' }>;
    const parts = it.code.split('____');
    ready = it.blanks.every((_, i) => (text[i] ?? '').trim() !== '');
    check = () => finish(it.blanks.every((ok, i) => ok.some((a) => norm(a) === norm(text[i] ?? ''))));
    body = (
      <pre className="lf-fill">
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < parts.length - 1 && (
              <input
                type="text" spellCheck={false} autoCapitalize="off" autoComplete="off"
                aria-label={`Blank ${i + 1}`} size={Math.max(8, ...it.blanks[i].map((a) => a.length + 1))}
                value={text[i] ?? ''}
                onChange={(e) => { const t = [...text]; t[i] = e.target.value; setText(t); setResult(null); }}
              />
            )}
          </span>
        ))}
      </pre>
    );
  } else if (item.type === 'free') {
    const it = item as Extract<PracticeItem, { type: 'free' }>;
    body = (
      <>
        <textarea rows={3} aria-label="Your answer" placeholder="Say it in your own words first…" value={text[0] ?? ''} onChange={(e) => setText([e.target.value])} />
        {!revealed ? (
          <button type="button" onClick={() => setRevealed(true)}>Show a model answer</button>
        ) : (
          <div className="lf-feedback info">
            <p><b>Model answer.</b> {rich(it.modelAnswer)}</p>
            {result === null ? (
              <p className="row">
                How did yours compare?
                <button type="button" onClick={() => finish(true)}>I had it</button>
                <button type="button" onClick={() => finish(false)}>Not yet</button>
              </p>
            ) : (
              <p>{result ? 'Counted as correct.' : 'Marked to revisit.'} {rich(it.explain)}</p>
            )}
          </div>
        )}
      </>
    );
  } else {
    body = <p><em>This question type is coming soon.</em></p>;
  }

  return (
    <div className="lf-q" hidden={hidden}>
      <p className="prompt"><span className="n">{n}</span>{rich(item.prompt)}</p>
      {body}
      {check && (
        <p className="row">
          <button type="button" className="primary" disabled={!ready} onClick={check}>Check</button>
        </p>
      )}
      {check && result !== null && (
        <div className={`lf-feedback ${result ? 'ok' : 'no'}`} role="status">
          <p>{result ? <CircleCheck size={17} aria-hidden="true" /> : <CircleX size={17} aria-hidden="true" />}<b>{result ? 'Correct.' : 'Not quite.'}</b> {result ? rich(item.explain) : 'Look at the question again and try another answer.'}</p>
          {!result && (
            <details>
              <summary>Show the explanation</summary>
              <p>{rich(item.explain)}</p>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default function PracticeSet({ lessonId, items }: { lessonId: string; items: PracticeItem[] }) {
  const [results, setResults] = useState<Record<number, boolean>>({});
  const correct = Object.values(results).filter(Boolean).length;
  const answered = Object.keys(results).length;

  useEffect(() => {
    if (answered) updateLesson(lessonId, { quiz: { correct, total: items.length } });
  }, [lessonId, correct, answered, items.length]);

  const [at, setAt] = useState(0);

  return (
    <div className="lf-practice not-content">
      <div className="pager">
        <span>Question {at + 1} of {items.length}</span>
        <ol className="dots">
          {items.map((_, i) => (
            <li key={i}>
              <button
                type="button"
                className={`${i === at ? 'current' : ''}${i in results ? (results[i] ? ' ok' : ' no') : ''}`}
                aria-label={`Question ${i + 1}${i in results ? (results[i] ? ' (correct)' : ' (not yet)') : ''}`}
                aria-current={i === at ? 'step' : undefined}
                onClick={() => setAt(i)}
              >
                {i + 1}
              </button>
            </li>
          ))}
        </ol>
        <p className="score" role="status">
          <b>{correct} / {items.length}</b> correct
        </p>
      </div>
      {items.map((item, i) => (
        <Item key={i} item={item} n={i + 1} hidden={i !== at} onResult={(ok) => setResults((r) => ({ ...r, [i]: ok }))} />
      ))}
      <div className="turn">
        <button type="button" disabled={at === 0} onClick={() => setAt(at - 1)}><ChevronLeft size={15} aria-hidden="true" />Previous</button>
        <button type="button" className={at in results ? 'primary' : ''} disabled={at === items.length - 1} onClick={() => setAt(at + 1)}>
          Next question<ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
