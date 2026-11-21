// =============================================================================
// Spielergespräch — ruhige gezeichnete Szene (Trainer und Spieler am Spielfeldrand)
// und kleine einfarbige Zeichen für Knöpfe/Status (currentColor, keine Emojis).
// Haltung des Spielers je Gesprächsphase: zuhören (Hände in den Hüften),
// angenommen (Handschlag), abgelehnt (Arme verschränkt).
// =============================================================================

export type ScenePhase = 'talk' | 'ok' | 'fail';

export function TalkScene({ phase, shirt }: { phase: ScenePhase; shirt?: string }) {
  const g = 'ptk-sc';
  return (
    <svg className={g} viewBox="0 0 440 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="ptkSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="ptk-sky-a" />
          <stop offset="1" className="ptk-sky-b" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="440" height="200" fill="url(#ptkSky)" />
      {/* Tribüne in der Ferne */}
      <path d="M0 96 L120 84 L300 84 L440 94 L440 122 L0 122 Z" className="ptk-stand" />
      <path d="M0 104 L440 104 M0 112 L440 112" className="ptk-stand-line" />
      {/* Flutlichtmast */}
      <path d="M382 30 L386 120" className="ptk-mast" />
      <rect x="370" y="22" width="28" height="12" rx="1.5" className="ptk-lamp" />
      {/* Rasen mit Seitenlinie und Strafraum in Perspektive */}
      <path d="M0 122 L440 122 L440 200 L0 200 Z" className="ptk-grass" />
      <path d="M0 140 L440 134" className="ptk-chalk" />
      <path d="M250 134 L232 200 M330 133 L352 200 M250 134 L330 133" className="ptk-chalk ptk-chalk-soft" />
      {/* Trainerbank */}
      <path d="M40 150 L104 150 L104 132 Q72 120 40 132 Z" className="ptk-bench" />
      <path d="M44 150 L44 160 M100 150 L100 160" className="ptk-mast" />
      {/* Ball */}
      <circle cx="318" cy="186" r="6" className="ptk-ball" />
      <Coach />
      <Pupil phase={phase} shirt={shirt} />
    </svg>
  );
}

function Coach() {
  return (
    <g className="ptk-coach" transform="translate(178 0)">
      <circle cx="0" cy="70" r="11" className="ptk-skin" />
      <path d="M-11 66 Q0 52 11 66 L11 63 Q0 54 -11 63 Z" className="ptk-hair" />
      {/* Trainingsjacke */}
      <path d="M-18 84 Q0 78 18 84 L21 132 L-21 132 Z" className="ptk-jacket" />
      <path d="M0 82 L0 132" className="ptk-zip" />
      {/* Arm rechts erklärend nach vorn, links locker */}
      <path d="M16 88 L34 108 L46 102" className="ptk-arm ptk-arm-jacket" />
      <path d="M-16 88 L-22 126" className="ptk-arm ptk-arm-jacket" />
      <circle cx="47" cy="101" r="3.6" className="ptk-skin" />
      {/* Hose */}
      <path d="M-17 132 L-15 186 L-4 186 L0 140 L4 186 L15 186 L17 132 Z" className="ptk-pants" />
      <path d="M-17 186 L-2 186 M3 186 L18 186" className="ptk-shoe" />
    </g>
  );
}

function Pupil({ phase, shirt }: { phase: ScenePhase; shirt?: string }) {
  return (
    <g className="ptk-player" transform="translate(262 0)">
      <circle cx="0" cy="68" r="11" className="ptk-skin" />
      <path d="M-11 65 Q-2 50 11 63 L10 60 Q0 51 -11 61 Z" className="ptk-hair" />
      {/* Trikot */}
      <path d="M-17 82 Q0 77 17 82 L19 128 L-19 128 Z" className="ptk-shirt" />
      {shirt && <path d="M-6 80 Q0 84 6 80" stroke={shirt} strokeWidth="3" fill="none" strokeLinecap="round" />}
      {phase === 'talk' && <>
        <path d="M-16 86 L-28 106 L-17 120" className="ptk-arm" />
        <path d="M16 86 L28 106 L17 120" className="ptk-arm" />
      </>}
      {phase === 'ok' && <>
        <path d="M-16 86 L-30 104 L-46 102" className="ptk-arm" />
        <circle cx="-46" cy="101.5" r="3.6" className="ptk-skin" />
        <path d="M16 86 L20 124" className="ptk-arm" />
      </>}
      {phase === 'fail' && <>
        <path d="M-16 86 L-12 106 L12 100" className="ptk-arm" />
        <path d="M16 86 L12 104 L-12 98" className="ptk-arm" />
      </>}
      {/* Hose, Stutzen, Schuhe */}
      <path d="M-18 128 L18 128 L17 146 L2 146 L0 136 L-2 146 L-17 146 Z" className="ptk-shorts" />
      <path d="M-11 146 L-11 186 M10 146 L10 186" className="ptk-leg" />
      <path d="M-11 166 L-11 186 M10 166 L10 186" className="ptk-sock" />
      <path d="M-18 187 L-6 187 M4 187 L17 187" className="ptk-shoe" />
    </g>
  );
}

type GlyphName = 'prev' | 'next' | 'info' | 'close' | 'check' | 'cross' | 'card' | 'injury';
const GLYPH: Record<GlyphName, string> = {
  prev: 'M14.5 5.5 8 12l6.5 6.5',
  next: 'M9.5 5.5 16 12l-6.5 6.5',
  info: 'M12 10.5v7M12 6.6v.2',
  close: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  check: 'M4.5 12.5l5 5 10-11',
  cross: 'M6 6l12 12M18 6 6 18',
  card: 'M8 3.5h8a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z',
  injury: 'M12 4v16M4 12h16',
};

/** Einfarbiges Zeichen (Strichstärke folgt der Größe). */
export function Glyph({ name, size = 18, className }: { name: GlyphName; size?: number; className?: string }) {
  const fill = name === 'card';
  return (
    <svg className={`ptk-glyph${className ? ` ${className}` : ''}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={GLYPH[name]} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={name === 'injury' ? 4 : 2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
