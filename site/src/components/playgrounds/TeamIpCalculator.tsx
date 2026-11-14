import { useRef, useState } from 'react';
import { deviceTable, pairs, parseTeam } from '../../sim/teamIp';
import Tasks from './Tasks';

/** Type a team number and see its 10.TE.AM.X addresses. */
export default function TeamIpCalculator({ lessonId }: { lessonId?: string }) {
  const [text, setText] = useState('1360');
  const seen = useRef({ short: false, long: false, zero: false });
  const team = parseTeam(text);
  if (team.ok) {
    if (team.team < 1000) seen.current.short = true;
    if (team.team > 9999) seen.current.long = true;
    if (team.am < 10 && team.te > 0) seen.current.zero = true;
  }
  const [a, b] = team.ok ? pairs(team) : ['TE', 'AM'];

  return (
    <div className="lf-playground lf-teamip">
      <Tasks
        lessonId={lessonId}
        tasks={[
          { label: 'Try a team number under 1000', done: seen.current.short },
          { label: 'Try a 5-digit team number', done: seen.current.long },
          { label: 'Try a number ending in 01 to 09', done: seen.current.zero },
        ]}
      />

      <label className="lf-knob">
        <span className="name"><b>Team number</b></span>
        <input type="text" inputMode="numeric" maxLength={6} value={text} aria-invalid={!team.ok} onChange={(e) => setText(e.target.value)} />
      </label>

      {team.ok ? (
        <>
          <p className="lf-ip-split" aria-label={`Address pattern 10.${team.te}.${team.am}.X`}>
            <span className="fixed">10</span>.<span className="pair">{team.te}<small>{a}</small></span>.<span className="pair">{team.am}<small>{b}</small></span>.<span className="x">X</span>
          </p>
          <table>
            <thead><tr><th>Device</th><th>Address</th></tr></thead>
            <tbody>
              {deviceTable(team).map((d) => (
                <tr key={d.device}>
                  <td>{d.device}<br /><small>{d.note}</small></td>
                  <td><code>{d.address}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="lf-feedback" role="alert">{team.reason}</p>
      )}
    </div>
  );
}
