// Zeile für einen VERDECKTEN Wert (Konstanz, Nervenstärke …): keine Zahl, nur die
// Einschätzung von Trainerteam bzw. Scouts (game/hiddenTraits.ts) – im Raster der Profil-Balken.
import type { Player } from '../../types';
import type { Game } from '../../game/state';
import { HIDDEN_LABEL, hiddenFor, type HiddenTrait } from '../../game/hiddenTraits';
import { InfoTip } from '../../ui/InfoTip';
import type { InfoKey } from '../../data/infoTexts';

export function HiddenLine({ g, p, trait, info, label }: { g: Game | undefined; p: Player; trait: HiddenTrait; info?: InfoKey; label?: string }) {
  const e = hiddenFor(g, p, trait);
  return (
    <div className="pp-bar-row hid-line">
      <span className="pp-bar-lbl">{label ?? HIDDEN_LABEL[trait]}{info && <InfoTip k={info} />}</span>
      <span className={`hid-word${e.word ? '' : ' none'}`}>{e.word ?? 'noch kein Urteil'}</span>
      <span className="hid-src">{e.source}{e.word && e.certainty !== 'gesichert' ? ` · ${e.certainty}` : ''}</span>
    </div>
  );
}
