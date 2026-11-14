import { CircleCheck, CircleX, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { faultAt, outcome, path, stackLayers } from '../../sim/abstractionStack';
import Tip from '../viz/Tip';
import Tasks from './Tasks';

const BOX_W = 300;
const BOX_H = 46;
const GAP = 14;
const X0 = 30;
const SVG_W = BOX_W + X0 * 2;
const SVG_H = stackLayers.length * (BOX_H + GAP);
const cy = (layer: number) => layer * (BOX_H + GAP) + BOX_H / 2;

/** Send a signal down the stack and back, then break one layer and see which symptoms appear. */
export default function AbstractionStack({ lessonId }: { lessonId?: string }) {
  const [fault, setFault] = useState<number | null>(null);
  const [pos, setPos] = useState<number | null>(0);
  const [run, setRun] = useState(0);
  const seen = useRef({ trip: false, broke: new Set<number>() });

  const result = outcome(fault === null ? null : faultAt(fault)!);
  const finished = pos !== null && pos >= result.steps.length - 1;
  if (finished && fault === null) seen.current.trip = true;
  if (finished && fault !== null) seen.current.broke.add(fault);

  useEffect(() => {
    setPos(0);
    const id = setInterval(() => {
      setPos((p) => {
        if (p === null || p >= result.steps.length - 1) { clearInterval(id); return p; }
        return p + 1;
      });
    }, 550);
    return () => clearInterval(id);
  }, [fault, run, result.steps.length]);

  const step = pos === null ? null : path[result.steps[Math.min(pos, result.steps.length - 1)]];
  const stepIndex = pos === null ? 0 : result.steps[Math.min(pos, result.steps.length - 1)];
  const f = fault === null ? null : faultAt(fault)!;
  const dotX = step?.returning ? X0 + BOX_W - 24 : X0 + 24;
  const stuck = finished && result.stuckAt !== null;

  return (
    <div className="lf-playground lf-stack">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Watch a signal make the full trip', done: seen.current.trip },
          { label: 'Break a layer and see what the driver sees', done: seen.current.broke.size >= 1 },
          { label: 'Break three different layers', done: seen.current.broke.size >= 3 },
        ]}
      />

      <div className="lf-stack-grid">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="lf-stack-map" role="group" aria-label="Abstraction stack">
          {stackLayers.map((l, i) => {
            const broken = fault === i;
            return (
              <g
                key={l.id}
                role="button"
                tabIndex={0}
                aria-pressed={broken}
                aria-label={`${l.name}${broken ? ', fault injected' : ''}`}
                onClick={() => setFault(broken ? null : i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFault(broken ? null : i); } }}
              >
                <rect x={X0} y={i * (BOX_H + GAP)} width={BOX_W} height={BOX_H} rx={8} className={`layer${broken ? ' broken' : ''}`} />
                <text x={SVG_W / 2} y={cy(i) - 3} textAnchor="middle"><tspan fontWeight={700}>{l.name}</tspan></text>
                <text x={SVG_W / 2} y={cy(i) + 13} textAnchor="middle" className="muted">{l.detail}</text>
              </g>
            );
          })}
          {step && (
            <circle cx={dotX} cy={cy(step.layer) + (step.returning ? 0 : 0)} r={9} className={`signal${stuck ? ' stuck' : ''}`} style={{ transition: 'cx 0.3s, cy 0.3s' }} />
          )}
        </svg>

        <div className="lf-stack-side">
          <p className="lf-stack-step" aria-live="polite">
            {step ? <><b>Step {stepIndex + 1}.</b> {step.text}</> : null}
          </p>
          <ul className="lf-stack-ind">
            {result.indicators.map((ind, i) => {
              const settled = finished || (pos !== null && ind.ok && pathReached(result.steps, pos, i));
              return (
                <li key={ind.label} className={settled ? (ind.ok ? 'ok' : 'bad') : ''}>
                  {settled ? (ind.ok ? <CircleCheck size={16} aria-label="Yes" /> : <CircleX size={16} aria-label="No" />) : <span className="wait" aria-hidden="true" />}
                  {ind.label}
                </li>
              );
            })}
          </ul>
          {finished && f && (
            <div className="lf-card" role="status">
              <p><b>{f.name}</b></p>
              <ul>{f.symptoms.map((s) => <li key={s}>{s}</li>)}</ul>
              <p className="check">Check: {f.check}</p>
            </div>
          )}
        </div>
      </div>

      <div className="lf-pg-bar">
        <button type="button" onClick={() => setRun(run + 1)}><Play size={15} aria-hidden="true" />Send again</button>
        <Tip label="How to use this">Click a layer to break it. Click it again to fix it.</Tip>
      </div>
    </div>
  );
}

/** While the dot is still travelling, an indicator lights once the dot has passed its threshold step. */
function pathReached(steps: number[], pos: number, indicator: number): boolean {
  const thresholds = [1, 3, 6, path.length];
  return steps[pos] + 1 >= thresholds[indicator];
}
