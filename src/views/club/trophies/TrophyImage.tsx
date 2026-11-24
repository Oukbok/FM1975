// =============================================================================
// <TrophyImage>: eine Trophäe als Bild – Foto `images/trophies/<form>.webp`, sobald die Form in
// data/trophyImages.ts freigeschaltet ist, sonst (und bei Ladefehlern) die Zeichnung TrophyArt.
// Einzige Stelle für Foto-oder-Zeichnung: Vitrine, Spielplan („Wettbewerbe dieser Saison“),
// Statistiken › Ligensystem (Liga-Kästen, Pokale des Landes). Neue Fotos erscheinen damit überall.
// =============================================================================
import { useEffect, useState } from 'react';
import { trophyPhoto } from '../../../data/trophyImages';
import { TROPHY_LABEL, type TrophyShape } from '../../../game/trophyCabinet';
import { TrophyArt } from './TrophyArt';

export function TrophyImage({ shape, img, className = '', title }: { shape: TrophyShape; /** eigenes Bild (Datensatz) vor dem Foto der Form */ img?: string; className?: string; /** Tooltip; fehlt = keiner */ title?: string | boolean }) {
  const src = img ?? trophyPhoto(shape);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [shape, img]);
  const tip = title === true ? TROPHY_LABEL[shape] : title || undefined;
  if (src && !failed) return <img className={`tro-art tro-photo ${className}`} src={src} alt="" title={tip} onError={() => setFailed(true)} />;
  return tip ? <span className={`tro-wrap ${className}`} title={tip}><TrophyArt shape={shape} /></span> : <TrophyArt shape={shape} className={className} />;
}
