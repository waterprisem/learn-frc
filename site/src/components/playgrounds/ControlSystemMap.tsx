import { RotateCcw, Scissors, TriangleAlert } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { LAYERS, type DeviceId, type Layer } from '../../data/hardware';
import { faultEffects, nodeNames, wires, type NodeId } from '../../sim/hardware/controlSystem';
import ComponentCard, { LayerChip } from '../hardware/ComponentCard';
import Tasks from './Tasks';

/** Where each device is drawn, and which card it opens. */
const NODES: Record<NodeId, { x: number; y: number; w: number; title: string; sub?: string; card: DeviceId }> = {
  battery: { x: 16, y: 20, w: 100, title: 'Battery', sub: '12 V', card: 'battery' },
  breaker: { x: 150, y: 20, w: 120, title: 'Main breaker', sub: '120 A', card: 'breaker' },
  pdh: { x: 315, y: 20, w: 150, title: 'PDH', sub: 'power distribution', card: 'pdh' },
  roborio: { x: 40, y: 170, w: 130, title: 'roboRIO', sub: 'runs your code', card: 'roborio' },
  kraken1: { x: 220, y: 170, w: 100, title: 'Kraken X60', sub: 'TalonFX · ID 5', card: 'kraken' },
  kraken2: { x: 340, y: 170, w: 100, title: 'Kraken X60', sub: 'TalonFX · ID 6', card: 'kraken' },
  cancoder: { x: 460, y: 170, w: 100, title: 'CANcoder', sub: 'ID 11', card: 'cancoder' },
  pigeon: { x: 580, y: 170, w: 100, title: 'Pigeon 2', sub: 'ID 13', card: 'pigeon' },
  limit: { x: 40, y: 310, w: 130, title: 'Limit switch', card: 'limit-switch' },
  radio: { x: 220, y: 310, w: 110, title: 'Radio', sub: '10.13.60.1', card: 'radio' },
  ds: { x: 410, y: 310, w: 130, title: 'Driver Station', sub: 'laptop', card: 'ds' },
  controller: { x: 600, y: 310, w: 120, title: 'Xbox controller', card: 'controller' },
  coprocessor: { x: 220, y: 400, w: 110, title: 'Coprocessor', sub: 'PhotonVision', card: 'camera' },
  camera: { x: 410, y: 400, w: 130, title: 'Camera', card: 'camera' },
};
const NODE_H = 46;

/** The drawn route of each wire, the point where it can be cut, and an optional label. */
const ROUTES: Record<string, { d: string; cut: [number, number]; label?: [string, number, number] }> = {
  'power:battery-breaker': { d: 'M116 43H150', cut: [133, 43] },
  'power:breaker-pdh': { d: 'M270 43H315', cut: [292, 43] },
  'power:pdh-roborio': { d: 'M390 66V120H105V170', cut: [105, 145] },
  'power:pdh-kraken1': { d: 'M390 66V120H270V170', cut: [270, 145] },
  'power:pdh-kraken2': { d: 'M390 66V170', cut: [390, 145] },
  'power:pdh-cancoder': { d: 'M390 66V120H510V170', cut: [510, 145] },
  'power:pdh-pigeon': { d: 'M390 66V120H630V170', cut: [630, 145] },
  'power:pdh-radio': { d: 'M390 66V120H195V333H220', cut: [195, 300] },
  'power:pdh-coprocessor': { d: 'M390 66V120H195V423H220', cut: [195, 385] },
  'can:roborio-kraken1': { d: 'M145 216V250H250V216', cut: [172, 250], label: ['120 Ω', 150, 243] },
  'can:kraken1-kraken2': { d: 'M290 216V250H370V216', cut: [330, 250] },
  'can:kraken2-cancoder': { d: 'M410 216V250H490V216', cut: [450, 250] },
  'can:cancoder-pigeon': { d: 'M530 216V250H610V216', cut: [570, 250] },
  'can:pigeon-pdh': { d: 'M650 216V250H710V43H465', cut: [710, 140], label: ['120 Ω', 500, 36] },
  'network:roborio-radio': { d: 'M105 216V280H300V310', cut: [250, 280], label: ['Ethernet', 232, 273] },
  'network:radio-ds': { d: 'M330 333H410', cut: [370, 333], label: ['Wi-Fi', 370, 318] },
  'network:radio-coprocessor': { d: 'M275 356V400', cut: [275, 378] },
  'dio:limit-roborio': { d: 'M70 216V310', cut: [70, 270], label: ['DIO', 84, 300] },
  'dio:camera-coprocessor': { d: 'M330 423H410', cut: [370, 423], label: ['USB', 370, 408] },
  'dio:controller-ds': { d: 'M540 333H600', cut: [570, 333], label: ['USB', 570, 318] },
};

const LAYER_IDS = Object.keys(LAYERS) as Layer[];
const press = (run: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); }
};

/**
 * The whole robot as one wiring diagram. Switch layers on and off, open any device's card,
 * and break a wire to see what stops working.
 */
export default function ControlSystemMap({ lessonId }: { lessonId?: string }) {
  const [shown, setShown] = useState<Record<Layer, boolean>>({ power: true, can: true, network: true, dio: true });
  const [selected, setSelected] = useState<NodeId | null>(null);
  const [cutting, setCutting] = useState(false);
  const [broken, setBroken] = useState<string | null>(null);

  const fault = broken ? faultEffects(broken) : null;
  const brokenWire = wires.find((w) => w.id === broken);
  const visible = wires.filter((w) => shown[w.layer]);

  function toggleLayer(l: Layer) {
    setShown({ ...shown, [l]: !shown[l] });
    if (brokenWire?.layer === l) setBroken(null);
  }

  return (
    <div className="lf-playground lf-map">
      <Tasks
        lessonId={lessonId}
        tasks={LAYER_IDS.map((l) => ({ label: `Break a ${LAYERS[l].label} wire`, done: brokenWire?.layer === l }))}
      />

      <div className="lf-pg-bar head">
        <div className="layers" role="group" aria-label="Layers shown">
          {LAYER_IDS.map((l) => (
            <button key={l} type="button" aria-pressed={shown[l]} onClick={() => toggleLayer(l)}><LayerChip layer={l} /></button>
          ))}
        </div>
        <span className="spacer" />
        <button type="button" aria-pressed={cutting} className={cutting ? 'primary' : ''} onClick={() => { setCutting(!cutting); setBroken(null); }}>
          <Scissors size={15} aria-hidden="true" />Break a wire
        </button>
      </div>

      <div className="scroll">
        <svg viewBox="0 0 730 460" role="group" aria-label="Wiring diagram of the robot’s control system">
          {visible.map((w) => {
            const l = LAYERS[w.layer];
            const r = ROUTES[w.id];
            return (
              <g key={w.id} className={w.id === broken ? 'wire cut' : 'wire'}>
                <path d={r.d} stroke={`var(${l.cssVar})`} strokeWidth={l.width} strokeDasharray={l.dash} />
                {r.label && <text className="muted" x={r.label[1]} y={r.label[2]} textAnchor={r.label[0] === '120 Ω' || r.label[0] === 'DIO' ? 'start' : 'middle'}>{r.label[0]}</text>}
              </g>
            );
          })}

          {(Object.keys(NODES) as NodeId[]).map((id) => {
            const n = NODES[id];
            const state = fault?.off.includes(id) ? ' off' : fault?.lost.includes(id) ? ' lost' : '';
            return (
              <g
                key={id}
                role="button"
                tabIndex={0}
                aria-pressed={selected === id}
                aria-label={`${nodeNames[id]}${state === ' off' ? ' (no power)' : state === ' lost' ? ' (unreachable)' : ''}`}
                className={`node${selected === id ? ' sel' : ''}${state}`}
                onClick={() => setSelected(selected === id ? null : id)}
                onKeyDown={press(() => setSelected(selected === id ? null : id))}
              >
                <rect x={n.x} y={n.y} width={n.w} height={NODE_H} rx="6" />
                <text x={n.x + n.w / 2} y={n.y + (n.sub ? 20 : 28)} textAnchor="middle">{n.title}</text>
                {n.sub && <text className="muted" x={n.x + n.w / 2} y={n.y + 36} textAnchor="middle">{n.sub}</text>}
              </g>
            );
          })}

          {cutting && visible.map((w) => {
            const [x, y] = ROUTES[w.id].cut;
            const isCut = w.id === broken;
            const act = () => setBroken(isCut ? null : w.id);
            return (
              <g
                key={w.id}
                role="button"
                tabIndex={0}
                aria-pressed={isCut}
                aria-label={`${LAYERS[w.layer].label} wire between ${nodeNames[w.from]} and ${nodeNames[w.to]}`}
                className={isCut ? 'cutter on' : 'cutter'}
                onClick={act}
                onKeyDown={press(act)}
              >
                <circle cx={x} cy={y} r="9" />
                <path d={`M${x - 4} ${y - 4}l8 8M${x + 4} ${y - 4}l-8 8`} />
              </g>
            );
          })}
        </svg>
      </div>

      {cutting && (
        <div className="lf-feedback info fault" role="status">
          {fault && brokenWire ? (
            <>
              <p><TriangleAlert size={16} aria-hidden="true" /><b>{LAYERS[brokenWire.layer].label} wire broken between the {nodeNames[brokenWire.from]} and the {nodeNames[brokenWire.to]}.</b></p>
              {fault.effects.map((e) => <p key={e}>{e}</p>)}
              <p><button type="button" onClick={() => setBroken(null)}><RotateCcw size={15} aria-hidden="true" />Repair</button></p>
            </>
          ) : (
            <p>Select a ✕ on any wire.</p>
          )}
        </div>
      )}

      {selected && <ComponentCard id={NODES[selected].card} />}
    </div>
  );
}
