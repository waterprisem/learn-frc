import { useState, type ReactNode } from 'react';
import Tip from '../viz/Tip';

interface Mech {
  id: string;
  name: string;
  control: 'Velocity' | 'Voltage' | 'Position';
  art: ReactNode;
}

const ART_STROKE = { stroke: 'var(--sl-color-gray-3)', strokeWidth: 2, fill: 'none' } as const;

const MECHS: Mech[] = [
  {
    id: 'flywheel',
    name: 'Flywheel',
    control: 'Velocity',
    art: (
      <>
        <path d="M70 130 L100 70 L130 130 Z" className="m-body" />
        <g className="m-spin" style={{ transformOrigin: '100px 70px' }}>
          <circle cx="100" cy="70" r="42" style={{ fill: 'none', stroke: 'var(--sig-measurement)', strokeWidth: 6 }} />
          {[0, 60, 120].map((a) => (
            <line key={a} x1="100" y1="34" x2="100" y2="106" transform={`rotate(${a} 100 70)`} {...ART_STROKE} />
          ))}
          <circle cx="100" cy="34" r="4" style={{ fill: 'var(--sig-setpoint)' }} />
        </g>
        <circle cx="100" cy="70" r="6" className="m-hub" />
      </>
    ),
  },
  {
    id: 'intake',
    name: 'Intake rollers',
    control: 'Voltage',
    art: (
      <>
        <g className="m-spin" style={{ transformOrigin: '72px 70px' }}>
          <circle cx="72" cy="70" r="20" style={{ fill: 'none', stroke: 'var(--sig-output)', strokeWidth: 6 }} />
          <line x1="72" y1="52" x2="72" y2="88" {...ART_STROKE} />
        </g>
        <g className="m-spin m-rev" style={{ transformOrigin: '128px 70px' }}>
          <circle cx="128" cy="70" r="20" style={{ fill: 'none', stroke: 'var(--sig-output)', strokeWidth: 6 }} />
          <line x1="128" y1="52" x2="128" y2="88" {...ART_STROKE} />
        </g>
        <circle className="m-ball" cx="100" cy="70" r="13" style={{ fill: 'var(--sig-setpoint)' }} />
      </>
    ),
  },
  {
    id: 'elevator',
    name: 'Elevator',
    control: 'Position',
    art: (
      <>
        <rect x="76" y="12" width="48" height="116" rx="3" className="m-body" />
        <rect x="60" y="124" width="80" height="10" rx="3" className="m-hub" />
        <rect className="m-lift" x="70" y="22" width="60" height="16" rx="3" style={{ fill: 'var(--sig-measurement)' }} />
      </>
    ),
  },
  {
    id: 'arm',
    name: 'Arm',
    control: 'Position',
    art: (
      <>
        <rect x="50" y="95" width="20" height="35" className="m-body" />
        <g className="m-swing" style={{ transformOrigin: '60px 95px' }}>
          <line x1="60" y1="95" x2="150" y2="95" style={{ stroke: 'var(--sig-measurement)', strokeWidth: 8, strokeLinecap: 'round' }} />
          <circle cx="150" cy="95" r="9" style={{ fill: 'var(--sig-setpoint)' }} />
        </g>
        <circle cx="60" cy="95" r="7" className="m-hub" />
      </>
    ),
  },
  {
    id: 'swerve',
    name: 'Swerve module',
    control: 'Velocity',
    art: (
      <>
        <rect x="60" y="30" width="80" height="80" rx="8" className="m-body" />
        <g className="m-steer" style={{ transformOrigin: '100px 70px' }}>
          <rect x="88" y="42" width="24" height="56" rx="5" style={{ fill: 'var(--sl-color-gray-5)', stroke: 'var(--sig-output)', strokeWidth: 3 }} />
          <line className="m-tread" x1="100" y1="48" x2="100" y2="92" style={{ stroke: 'var(--sig-output)', strokeWidth: 3, strokeDasharray: '6 6' }} />
          <path d="M100 30 L94 40 H106 Z" style={{ fill: 'var(--sig-setpoint)' }} />
        </g>
      </>
    ),
  },
  {
    id: 'climber',
    name: 'Climber',
    control: 'Voltage',
    art: (
      <>
        <rect x="50" y="10" width="100" height="6" rx="3" className="m-hub" />
        <rect className="m-rope" x="99" y="16" width="2" height="100" style={{ fill: 'var(--sl-color-gray-2)' }} />
        <rect className="m-hoist" x="78" y="116" width="44" height="20" rx="4" style={{ fill: 'var(--sig-measurement)' }} />
      </>
    ),
  },
];

/** Looping animations of the lesson's mechanisms; pick one from the list. */
export default function MechanismGallery({ lessonId: _lessonId }: { lessonId?: string }) {
  const [id, setId] = useState(MECHS[0].id);
  const m = MECHS.find((x) => x.id === id)!;

  return (
    <div className="lf-playground lf-mech">
      <div className="lf-mech-body">
        <ul className="lf-mech-list">
          {MECHS.map((x) => (
            <li key={x.id}>
              <button type="button" aria-pressed={x.id === id} onClick={() => setId(x.id)}>
                {x.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="lf-mech-stage">
          <svg key={m.id} viewBox="0 0 200 140" role="img" aria-label={`${m.name}, ${m.control.toLowerCase()} control`}>
            {m.art}
          </svg>
          <div className="lf-mech-label">
            <b>{m.name}</b>
            <span className="lf-chip">{m.control}</span>
            <Tip label="About the animation">Simplified side views, looping. With reduced motion on, each shows one pose.</Tip>
          </div>
        </div>
      </div>
    </div>
  );
}
