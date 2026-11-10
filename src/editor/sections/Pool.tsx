import { Dataset } from '../../data/dataset/schema';
import { builtinDataset } from '../../data/dataset/builtin';
import { POOL_REGIONS, type PoolTown } from '../../data/poolTowns';
import { Col, Explain, TableEditor } from '../TableEditor';

// =============================================================================
// AMATEUR-POOL (Datensatz-Feld `poolTowns`, Spiel: game/clubPool.ts `refillPool`)
// =============================================================================
const COLS: Col[] = [
  { key: 'town', label: 'Stadt', width: 220, hint: 'Vereinsname = Stadt; nur Städte ohne Verein im Spiel rücken nach' },
  { key: 'group', label: 'Region', type: 'select', width: 160, options: POOL_REGIONS },
];

export function PoolSection({ ds, onChange }: { ds: Dataset; onChange: () => void }) {
  // Alte Datensätze ohne Feld: mit der eingebauten Liste beginnen.
  if (!ds.poolTowns) ds.poolTowns = JSON.parse(JSON.stringify(builtinDataset().poolTowns ?? [])) as PoolTown[];
  const rows = ds.poolTowns;
  const counts = POOL_REGIONS.map((r) => `${r.label} ${rows.filter((t) => t.group === r.value).length}`).join(' · ');
  return (
    <div className="ed-section">
      <Explain>Unterhalb der untersten Liga liegt ein <b>Pool an Amateurvereinen</b>, aus dem Aufsteiger nachrücken (West und DDR je eigener Pool; im Ausland je Land automatisch). Reformen wie die 3. Liga oder neue Regionalligen holen viele Pool-Vereine in die Pyramide. Fällt der Pool unter 24 Vereine, entstehen neue Amateurvereine aus den Städten dieser Liste – in der angegebenen Reihenfolge, nur Städte, die noch keinen Verein im Spiel haben. Die Region bestimmt die Staffel (Nord/West/Süd) bzw. den DDR-Pool. {counts}</Explain>
      <TableEditor rows={rows} cols={COLS} onChange={onChange} searchKeys={['town', 'group']}
        makeRow={() => ({ town: 'Neue Stadt', group: 'west' })} />
    </div>
  );
}
