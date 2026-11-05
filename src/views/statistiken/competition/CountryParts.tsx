// =============================================================================
// Bausteine der Länderwahl (Statistiken › Liga/Pokal): Länderauswahl mit Flagge,
// Teilnehmerliste (Hintergrund-Saison läuft noch) und Siegerliste nicht simulierter Pokale.
// Daten: game/competitionCountry.ts
// =============================================================================
import { CountryFlag } from '../../../components/competition/CountryFlag';
import type { StatsCountry } from '../../../game/competitionCountry';
import type { CompSnapshot } from '../../../game/competitionView';
import type { Game } from '../../../game/state';
import Select from '../../../ui/Select';
import { TeamName } from './parts';

const GROUP: Record<StatsCountry['mode'], string> = { home: 'Heimatland', div: 'Spiel für Spiel', world: 'Hintergrund' };

export function CountrySelect({ countries, value, onChange }: { countries: StatsCountry[]; value: string; onChange: (cc: string) => void }) {
  const groups = (['home', 'div', 'world'] as const).filter((m) => countries.some((c) => c.mode === m));
  return (
    <Select className="dselect cmp-country" width={168} popWidth={250} listHeight={420} value={value} onChange={onChange} title="Land" aria-label="Land">
      {groups.map((m) => (
        <optgroup key={m} label={GROUP[m]}>
          {countries.filter((c) => c.mode === m).map((c) => (
            <option key={c.cc} value={c.cc}>
              <span className="cmp-cflag"><CountryFlag country={c.flag} height={13} /></span>{c.name}{c.hint === 'aufgelöst' ? ' (aufgelöst)' : ''}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}

/** Zeile über Tabelle/Liste: Art des Stands (Abschlusstabelle, Teilnehmer …). */
export function Caption({ snap }: { snap: CompSnapshot }) {
  return snap.caption ? <div className="cmp-caption">{snap.caption}</div> : null;
}

/** Teilnehmer einer Hintergrund-Saison, die noch nicht ausgespielt ist (ohne Platzierung). */
export function RosterList({ g, snap }: { g: Game; snap: CompSnapshot }) {
  return (
    <div className="cmp-scroll">
      <div className="cmp-roster">
        {(snap.table ?? []).map((r) => (
          <div key={r.clubId} className={`rl-row ${r.clubId === g.managedClubId ? 'me' : ''}`}>
            <TeamName g={g} id={r.clubId} season={snap.season} size={22} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Pokal ohne Runden: Sieger (und Finalgegner, soweit bekannt) je Saison. */
export function WinnersList({ g, snap }: { g: Game; snap: CompSnapshot }) {
  const list = snap.winners ?? [];
  if (!list.length) return <div className="dnote cmp-empty-note">Keine Pokalsieger bekannt – dieser Pokal wird nicht simuliert.</div>;
  return (
    <div className="cmp-scroll">
      <table className="dtable cmp-table">
        <thead><tr><th>Saison</th><th>Pokalsieger</th><th>Finalgegner</th></tr></thead>
        <tbody>
          {list.map((w) => (
            <tr key={w.season} className={w.season === snap.season ? 'cmp-cur' : ''}>
              <td className="nowrap muted">{w.season}</td>
              <td className="nowrap">{w.winner ? <TeamName g={g} id={w.winner} season={w.season} size={22} /> : '–'}</td>
              <td className="nowrap muted">{w.finalist ? <TeamName g={g} id={w.finalist} season={w.season} size={18} /> : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
