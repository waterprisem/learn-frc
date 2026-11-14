import { useId, useMemo, useState } from 'react';

/** One line on a chart. Color and dash come from the fixed signal palette (styles/tokens.css). */
export interface ChartSeries {
  key: string;
  label: string;
  unit: string;
  cssVar: string;
  dash?: string;
  width?: number;
  axis?: 'left' | 'right';
}

type Row = { t: number } & Record<string, number | boolean>;

interface Props {
  data: Row[];
  series: ChartSeries[];
  /** Key of a boolean field drawn as a shaded band while true. */
  band?: { key: string; label: string };
  leftLabel: string;
  rightLabel?: string;
  /** Live charts show only the most recent N seconds. */
  windowSeconds?: number;
  /** The axes always reach at least this high, so a quiet graph doesn't zoom in on noise. */
  leftSpan?: number;
  rightSpan?: number;
  /** Smaller, with no legend toggles or readout (for practice items). */
  compact?: boolean;
  ariaLabel: string;
}

const W = 640;

/** Round a range outward to tick marks at 1, 2 or 5 × 10ⁿ. */
function niceScale(min: number, max: number, target = 5): { min: number; max: number; ticks: number[] } {
  const span = max - min || 1;
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { min: lo, max: hi, ticks };
}

const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(Math.abs(v) < 10 ? 2 : 1));

export default function Chart({ data, series, band, leftLabel, rightLabel, windowSeconds, leftSpan = 10, rightSpan = 12, compact, ariaLabel }: Props) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();

  const H = compact ? 190 : 280;
  const m = { l: 46, r: rightLabel ? 46 : 12, t: 12, b: 30 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;

  const view = useMemo(() => {
    const tEnd = data.length ? data[data.length - 1].t : (windowSeconds ?? 1);
    const t1 = windowSeconds ? Math.max(windowSeconds, tEnd) : tEnd || 1;
    const t0 = windowSeconds ? t1 - windowSeconds : 0;
    const rows = windowSeconds ? data.filter((d) => d.t >= t0) : data;
    const extent = (axis: 'left' | 'right') => {
      let lo = 0;
      let hi = axis === 'left' ? leftSpan : rightSpan;
      for (const s of series) {
        if ((s.axis ?? 'left') !== axis || hidden[s.key]) continue;
        for (const d of rows) {
          const v = d[s.key] as number;
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
      }
      // Ignore a sliver below zero (for example a tiny overshoot) so it doesn't add a whole empty band.
      return { lo: lo > -0.04 * hi ? 0 : lo, scale: niceScale(0, hi) };
    };
    // Both axes share one zero line: give each the same fraction of space below zero.
    const [l, r] = [extent('left'), extent('right')];
    const below = Math.max(-l.lo / l.scale.max, -r.lo / r.scale.max);
    const withNegatives = ({ scale }: typeof l) => {
      const step = scale.ticks[1] - scale.ticks[0];
      const min = -below * scale.max;
      const ticks = [...scale.ticks];
      for (let v = -step; v >= min - 1e-9; v -= step) ticks.unshift(v);
      return { min, max: scale.max, ticks };
    };
    return { t0, t1, rows, left: withNegatives(l), right: withNegatives(r) };
  }, [data, series, hidden, windowSeconds, leftSpan, rightSpan]);

  const { t0, t1, rows, left, right } = view;
  const x = (t: number) => m.l + ((t - t0) / (t1 - t0)) * iw;
  const y = (v: number, a: { min: number; max: number }) => m.t + ih - ((v - a.min) / (a.max - a.min)) * ih;

  const paths = series.map((s) => {
    const a = (s.axis ?? 'left') === 'left' ? left : right;
    let d = '';
    for (let i = 0; i < rows.length; i++) d += `${i ? 'L' : 'M'}${x(rows[i].t).toFixed(1)} ${y(rows[i][s.key] as number, a).toFixed(1)}`;
    return d;
  });

  const bands: Array<[number, number]> = [];
  if (band) {
    let start: number | null = null;
    rows.forEach((d, i) => {
      if (d[band.key] && start === null) start = d.t;
      if (start !== null && (!d[band.key] || i === rows.length - 1)) {
        bands.push([start, d.t]);
        start = null;
      }
    });
  }

  const xTicks = niceScale(t0, t1, 6).ticks.filter((t) => t >= t0 - 1e-9 && t <= t1 + 1e-9);
  const shown = hover !== null && rows[hover] ? rows[hover] : rows[rows.length - 1];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!rows.length) return;
    const box = e.currentTarget.getBoundingClientRect();
    const t = t0 + (((e.clientX - box.left) / box.width) * W - m.l) / iw * (t1 - t0);
    let best = 0;
    for (let i = 1; i < rows.length; i++) if (Math.abs(rows[i].t - t) < Math.abs(rows[best].t - t)) best = i;
    setHover(best);
  }

  return (
    <figure className={`lf-chart${compact ? ' compact' : ''}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={compact ? undefined : onMove}
        onPointerLeave={() => setHover(null)}
      >
        {bands.map(([a, b], i) => (
          <rect key={i} x={x(a)} y={m.t} width={Math.max(1, x(b) - x(a))} height={ih} className="band" />
        ))}
        {left.ticks.map((v) => (
          <g key={`l${v}`}>
            <line x1={m.l} x2={W - m.r} y1={y(v, left)} y2={y(v, left)} className={v === 0 ? 'zero' : 'grid'} />
            <text x={m.l - 6} y={y(v, left) + 4} textAnchor="end">{v}</text>
          </g>
        ))}
        {rightLabel && right.ticks.map((v) => (
          <text key={`r${v}`} x={W - m.r + 6} y={y(v, right) + 4}>{v}</text>
        ))}
        {xTicks.map((t) => (
          <text key={`x${t}`} x={x(t)} y={H - m.b + 16} textAnchor="middle">{t}</text>
        ))}
        <text x={m.l + iw / 2} y={H - 2} textAnchor="middle" className="axis">time (s)</text>
        <text x={12} y={m.t + ih / 2} textAnchor="middle" transform={`rotate(-90 12 ${m.t + ih / 2})`} className="axis">{leftLabel}</text>
        {rightLabel && (
          <text x={W - 10} y={m.t + ih / 2} textAnchor="middle" transform={`rotate(90 ${W - 10} ${m.t + ih / 2})`} className="axis">{rightLabel}</text>
        )}
        <clipPath id={clipId}><rect x={m.l} y={m.t} width={iw} height={ih} /></clipPath>
        {series.map((s, i) =>
          hidden[s.key] ? null : (
            <path key={s.key} d={paths[i]} clipPath={`url(#${clipId})`} fill="none" stroke={`var(${s.cssVar})`} strokeWidth={s.width ?? 2} strokeDasharray={s.dash} strokeLinejoin="round" />
          ),
        )}
        {hover !== null && rows[hover] && <line x1={x(rows[hover].t)} x2={x(rows[hover].t)} y1={m.t} y2={m.t + ih} className="cursor" />}
      </svg>
      <figcaption>
        {series.map((s) => {
          const swatch = (
            <svg width="26" height="10" aria-hidden="true">
              <line x1="1" x2="25" y1="5" y2="5" stroke={`var(${s.cssVar})`} strokeWidth={s.width ?? 2} strokeDasharray={s.dash} />
            </svg>
          );
          const value = !compact && shown ? <b>{fmt(shown[s.key] as number)} {s.unit}</b> : null;
          return compact ? (
            <span key={s.key} className="key">{swatch}{s.label}</span>
          ) : (
            <button
              key={s.key}
              type="button"
              className="key"
              aria-pressed={!hidden[s.key]}
              title={hidden[s.key] ? `Show ${s.label}` : `Hide ${s.label}`}
              onClick={() => setHidden((h) => ({ ...h, [s.key]: !h[s.key] }))}
            >
              {swatch}{s.label} {value}
            </button>
          );
        })}
        {band && (
          <span className="key">
            <span className="band-swatch" aria-hidden="true" />
            {band.label}{!compact && shown ? <b> {shown[band.key] ? 'true' : 'false'}</b> : null}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
