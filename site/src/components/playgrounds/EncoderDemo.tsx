import { Power, Home } from 'lucide-react';
import { useState } from 'react';
import { absoluteReading, home, initialEncoder, powerCycle, relativeError, relativeReading, setShaft } from '../../sim/encoders';
import Tip from '../viz/Tip';

const R = 52;

function Dial({ title, reading, angle, zero, ok }: { title: string; reading: number; angle: number; zero?: number; ok: boolean }) {
  return (
    <div className="lf-enc-dial">
      <svg viewBox="-70 -70 140 140" role="img" aria-label={`${title} encoder: shaft at ${Math.round(angle)} degrees, reads ${Math.round(reading)} degrees`}>
        <circle r={R} className="rim" />
        <line y1={-R - 8} y2={-R + 6} className="home-mark" />
        {zero !== undefined && (
          <g transform={`rotate(${zero})`}>
            <line y1={-R - 6} y2={-R + 10} className={ok ? 'zero-mark ok' : 'zero-mark'} />
          </g>
        )}
        <g className="shaft" style={{ transform: `rotate(${angle}deg)` }}>
          <line y2={-R + 8} className="pointer" />
          <circle r="5" className="hub" />
        </g>
      </svg>
      <div className="name">{title}</div>
      <output className={ok ? 'reading' : 'reading bad'}>{Math.round(reading)}°</output>
    </div>
  );
}

/** A rotating shaft read by a relative and an absolute encoder; power-cycle and home buttons. */
export default function EncoderDemo({ lessonId: _lessonId }: { lessonId?: string }) {
  const [s, setS] = useState(initialEncoder);
  const err = relativeError(s);

  return (
    <div className="lf-playground lf-enc">
      <div className="lf-enc-dials">
        <Dial title="Relative" reading={relativeReading(s)} angle={s.shaft} zero={s.zero} ok={err === 0} />
        <Dial title="Absolute" reading={absoluteReading(s)} angle={s.shaft} ok />
      </div>
      <label className="lf-knob">
        <span className="name"><b>Shaft</b> angle</span>
        <input type="range" min={0} max={359} value={Math.round(s.shaft)} onChange={(e) => setS(setShaft(s, +e.target.value))} />
        <output>{Math.round(s.shaft)}°</output>
      </label>
      <div className="lf-pg-bar">
        <Tip label="About the dials">
          The white tick is the real home position. The relative dial also marks where it believes 0 is.
        </Tip>
        <span className="lf-enc-status" role="status">{err === 0 ? 'Relative matches' : `Relative is off by ${Math.abs(Math.round(err))}°`}</span>
        <span className="spacer" />
        <button type="button" onClick={() => setS(powerCycle(s))}><Power size={15} aria-hidden="true" />Power cycle</button>
        <button type="button" onClick={() => setS(home(s))}><Home size={15} aria-hidden="true" />Home</button>
      </div>
    </div>
  );
}
