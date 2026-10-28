import Icon from '../../components/Icon';
import { Dataset } from '../../data/dataset/schema';
import { Issue } from '../validate';
import { Explain } from '../TableEditor';

// =============================================================================
// PRÜFEN & ÜBERNEHMEN
// =============================================================================
export function CheckSection({ ds, issues, onCheck, onExport, onStore }: {
  ds: Dataset; issues: Issue[] | null; onCheck: () => void; onExport: () => void; onStore: () => void;
}) {
  const errs = issues?.filter((i) => i.level === 'error') ?? [];
  const warns = issues?.filter((i) => i.level === 'warn') ?? [];
  return (
    <div className="ed-section">
      <Explain><b>Prüfen</b> sucht nach Fehlern, die das Spiel ablehnen oder aus dem Tritt bringen würden (z. B. doppelte IDs, ungerade Ligagrößen), und nach Hinweisen, die du dir ansehen solltest. <b>Exportieren</b> lädt die Datei <code>{ds.meta.id}.fm1975.json</code> herunter – zum Weitergeben oder Sichern. <b>Ins Spiel übernehmen</b> speichert den Datensatz direkt im Browser; im Spiel wählst du ihn bei „Neues Spiel“ aus. Laufende Spielstände bleiben unverändert.</Explain>
      <div className="ed-row">
        <button className="ed-btn" onClick={onCheck}><Icon name="whistle" /> Jetzt prüfen</button>
        <button className="ed-btn" onClick={onExport}><Icon name="save" /> Exportieren</button>
        <button className="ed-btn on" onClick={onStore}><Icon name="play" /> Ins Spiel übernehmen</button>
      </div>
      {!issues && <div className="ed-hint mt8">Noch nicht geprüft.</div>}
      {issues && issues.length === 0 && <div className="ed-ok mt8">Keine Fehler, keine Hinweise. Der Datensatz ist bereit.</div>}
      {issues && issues.length > 0 && (
        <div className="ed-issues">
          <div className="ed-sec">{errs.length} Fehler · {warns.length} Hinweise</div>
          {[...errs, ...warns].map((i, k) => (
            <div key={k} className={`ed-issue ${i.level}`}>
              <span className="ed-issue-lvl">{i.level === 'error' ? 'Fehler' : 'Hinweis'}</span>
              <span className="ed-issue-area">{i.area}</span>
              <span>{i.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
