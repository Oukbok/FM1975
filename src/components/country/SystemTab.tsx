// Länderprofil › Ligensystem: Pyramide des Landes (components/competition/LeaguePyramid.tsx,
// Daten game/leaguePyramid.ts) ohne Länderwahl.
import { countrySystem } from '../../game/countryProfile';
import { DashBox, Empty } from '../../ui/DashPage';
import { LeaguePyramid } from '../competition/LeaguePyramid';
import type { CountryTabProps } from './parts';

export default function SystemTab({ g, c, pyramid }: CountryTabProps) {
  const s = countrySystem(c, pyramid);
  const ok = s && s.sys.available !== false && s.sys.levels.length > 0;
  return (
    <DashBox title="Ligensystem" span={3} rows={2} right={`Saison ${pyramid.season}`} className="lp-box-page cnx-pyr">
      {ok ? <LeaguePyramid data={pyramid} mineId={g.managedClubId} lock={{ side: s.side, country: s.side === 'abroad' ? s.sys.key : undefined }} />
        : <Empty icon="stats">{c.kind === 'none' ? `Die Ligen von ${c.name} laufen im Spiel nicht mit – keine Daten.` : s?.sys.note ?? `${c.name} hat in dieser Saison keine eigenen Ligen – keine Daten.`}</Empty>}
    </DashBox>
  );
}
