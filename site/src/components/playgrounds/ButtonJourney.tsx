import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { clampStep, journey, layers, type Layer } from '../../sim/buttonJourney';
import Tip from '../viz/Tip';
import Tasks from './Tasks';

const layerColor: Record<Layer, string> = {
  USB: 'var(--sig-setpoint)',
  Network: 'var(--sig-profile)',
  Code: 'var(--sig-measurement)',
  CAN: 'var(--sig-output)',
  Physics: 'var(--sig-error)',
};
const LEFT = 70;
const COL = 40;
const ROW = 40;
const W = LEFT + COL * journey.length;
const H = ROW * layers.length + 10;
const x = (i: number) => LEFT + COL * i + COL / 2 - 10;
const y = (layer: Layer) => 10 + ROW * layers.indexOf(layer) + ROW / 2;

/** Step a button press from the controller to the motor and back to a graph, one hand-off at a time. */
export default function ButtonJourney({ lessonId }: { lessonId?: string }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const visited = useRef(new Set([0]));
  const jumped = useRef(false);
  visited.current.add(index);
  const step = journey[index];

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setIndex((i) => {
        if (i >= journey.length - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, 1200);
    return () => clearInterval(id);
  }, [playing]);

  function go(i: number, fromNode = false) {
    if (fromNode && Math.abs(i - index) > 1) jumped.current = true;
    setIndex(clampStep(i));
  }

  return (
    <div className="lf-playground lf-journey">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Follow the press all the way to the graph', done: visited.current.size === journey.length },
          { label: 'Jump straight to a step by clicking it', done: jumped.current },
        ]}
      />

      <svg viewBox={`0 0 ${W} ${H}`} className="lf-journey-map" role="group" aria-label="The 14 steps from button press to graph">
        {layers.map((l) => (
          <g key={l}>
            <line x1={LEFT - 6} x2={W} y1={y(l)} y2={y(l)} className="lane" />
            <text x={0} y={y(l) + 4} className="muted">{l}</text>
          </g>
        ))}
        <polyline className="path" points={journey.map((st, i) => `${x(i)},${y(st.layer)}`).join(' ')} />
        {journey.map((st, i) => (
          <g
            key={st.n}
            role="button"
            tabIndex={0}
            aria-label={`Step ${st.n}: ${st.layer}, ${st.where}`}
            aria-current={i === index ? 'step' : undefined}
            onClick={() => go(i, true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(i, true); } }}
          >
            <circle cx={x(i)} cy={y(st.layer)} r={i === index ? 13 : 10} fill={i <= index ? layerColor[st.layer] : 'var(--sl-color-bg)'} stroke={layerColor[st.layer]} strokeWidth={i === index ? 3 : 2} />
            <text x={x(i)} y={y(st.layer) + 4} textAnchor="middle" className="n" style={{ fill: i <= index ? 'var(--sl-color-bg)' : undefined }}>{st.n}</text>
          </g>
        ))}
      </svg>

      <div className="lf-card lf-journey-card" aria-live="polite">
        <p className="where">
          <b style={{ color: layerColor[step.layer] }}>{step.layer}</b>: {step.where}
          {step.inLoop && <span className="loop">in the 20 ms loop</span>}
        </p>
        <p>{step.what}</p>
      </div>

      <div className="lf-pg-bar">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0}><ChevronLeft size={15} aria-hidden="true" />Back</button>
        <button type="button" className="primary" onClick={() => go(index + 1)} disabled={index === journey.length - 1}>Next<ChevronRight size={15} aria-hidden="true" /></button>
        <button type="button" aria-pressed={playing} onClick={() => { if (index === journey.length - 1) setIndex(0); setPlaying(!playing); }}>
          {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <Tip label="About the diagram">Steps 1 to 10 carry the press out to the motor. Steps 11 to 14 carry the result back to the graph.</Tip>
        <span className="spacer" />
        <button type="button" onClick={() => { setIndex(0); setPlaying(false); }}><RotateCcw size={15} aria-hidden="true" />Reset</button>
      </div>
    </div>
  );
}
