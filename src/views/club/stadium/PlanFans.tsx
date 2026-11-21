// =============================================================================
// FANS IM STADION (Wunsch Pascal): Fankurve (beliebig viele Tribünen, z. B. Hinter-
// tor + Ecke) und Gästeblock (eine Tribüne) auf einem Tribünenplan festlegen –
// wirkt sofort, ohne Bau (Stadium.fans). Oben wählst du, was du setzt, dann klickst
// du Tribünen an. Der Gästeblock nimmt sein Kontingent zuerst von seiner Tribüne
// (engine/seating.ts); günstige Stehplätze in der Fankurve heben die Stimmung
// (engine/fanStands.ts). Preise je Tribüne: Verein › Kartenverkauf.
// =============================================================================
import { useState } from 'react';
import { STAND, STANDS } from '../../../data/seatingCatalog';
import { fanCultureOf, standingAllowed } from '../../../data/fanCulture';
import { fanStandMood } from '../../../engine/fanStands';
import { catAvailable } from '../../../engine/seating';
import { homeStands } from '../../../engine/stadiumExtras';
import { homeCountryOf, type Game } from '../../../game/state';
import type { StandId } from '../../../types';
import { InfoTip } from '../../../ui/InfoTip';

/** Tribünen auf dem Plan: Norden links, Haupttribüne (West) unten – wie in der Szene. */
const SHAPE: Record<StandId, string> = {
  gegen: 'M70 8 H230 V36 H70 Z',
  haupt: 'M70 124 H230 V152 H70 Z',
  tor1: 'M10 48 H38 V112 H10 Z',
  tor2: 'M262 48 H290 V112 H262 Z',
  ecke2: 'M10 40 Q12 10 62 8 V36 Q40 38 38 40 Z',
  ecke1: 'M10 120 Q12 150 62 152 V124 Q40 122 38 120 Z',
  ecke3: 'M290 40 Q288 10 238 8 V36 Q260 38 262 40 Z',
  ecke4: 'M290 120 Q288 150 238 152 V124 Q260 122 262 120 Z',
};
const LABEL: Record<StandId, [number, number, string]> = {
  gegen: [150, 22, 'Gegentribüne'], haupt: [150, 138, 'Haupttribüne'], tor1: [24, 80, 'N'], tor2: [276, 80, 'S'],
  ecke2: [33, 26, 'NO'], ecke1: [33, 134, 'NW'], ecke3: [267, 26, 'SO'], ecke4: [267, 134, 'SW'],
};

export function PlanFans({ g, year, onChange }: { g: Game; year: number; onChange: () => void }) {
  const club = g.clubs[g.managedClubId];
  const st = club.stadium;
  const fans = st.fans ?? {};
  const homes = homeStands(fans);
  const cc = homeCountryOf(g);
  const culture = fanCultureOf(cc);
  const [paint, setPaint] = useState<'home' | 'away'>('home');
  const save = (away: StandId | undefined, hs: StandId[]) => {
    st.fans = away || hs.length ? { away, homes: hs } : undefined;
    onChange();
  };
  const click = (s: StandId) => {
    if (paint === 'home') save(fans.away === s ? undefined : fans.away, homes.includes(s) ? homes.filter((h) => h !== s) : [...homes, s]);
    else save(fans.away === s ? undefined : s, homes.filter((h) => h !== s));
  };
  const info = fanStandMood(club, year, cc);
  const guestOk = catAvailable('gast', year);
  return (
    <section className="bc-sec">
      <div className="bc-sec-h"><span>Fans im Stadion<InfoTip k="fanTribuenen" /></span><small className="spf-now">gilt sofort, ohne Bau</small></div>
      <div className="spx-cat">
        <div className="spx-tiles two" role="radiogroup" aria-label="Was setzt du?">
          <button className={`spf-pick ${paint === 'home' ? 'on' : ''}`} onClick={() => setPaint('home')} aria-pressed={paint === 'home'}>
            <i className="spf-sw home" /><span><b>{culture.curve}</b><small>eigene Fans · mehrere Tribünen</small></span>
          </button>
          <button className={`spf-pick ${paint === 'away' ? 'on' : ''}`} onClick={() => setPaint('away')} aria-pressed={paint === 'away'}>
            <i className="spf-sw away" /><span><b>Gästeblock</b><small>{guestOk ? 'eine Tribüne' : 'erst ab 1984'}</small></span>
          </button>
        </div>
        <div className="spx-where">
          <svg viewBox="0 0 300 160" className="spx-map spf-map" role="group" aria-label="Tribünen">
            <rect x="48" y="44" width="204" height="72" className="pitch" />
            <line x1="150" y1="44" x2="150" y2="116" className="line" /><circle cx="150" cy="80" r="11" className="line" />
            {STANDS.map((d) => {
              const kind = fans.away === d.id ? 'away' : homes.includes(d.id) ? 'home' : '';
              const [lx, ly, lt] = LABEL[d.id];
              return (
                <g key={d.id} className={`stand-pick ${kind}`} role="button" tabIndex={0} aria-pressed={!!kind} aria-label={`${d.name} · ${d.sub}`}
                  onClick={() => click(d.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); click(d.id); } }}>
                  <title>{`${d.name} · ${d.sub}`}</title>
                  <path d={SHAPE[d.id]} />
                  <text x={lx} y={ly + 3.5}>{lt}</text>
                </g>
              );
            })}
          </svg>
          <div className="spf-list">
            <div><i className="spf-sw home" /><span><b>{culture.curve}</b>{homes.length ? homes.map((h) => STAND[h].name).join(', ') : 'nicht festgelegt'}</span></div>
            <div><i className="spf-sw away" /><span><b>Gästeblock</b>{fans.away ? STAND[fans.away].name : 'automatisch (Stehplätze zuerst)'}</span></div>
            <small className="spx-note">
              {guestOk ? `Gästekontingent laut Regel: ${Math.round(culture.guest * 100)} % der Plätze.` : 'Einen abgetrennten Gästeblock gibt es erst ab 1984.'}
              {standingAllowed(cc, year) ? ' Stehplätze sind erlaubt.' : ' In den oberen Ligen sind nur Sitzplätze erlaubt.'}
            </small>
          </div>
        </div>
        {info && <div className={`spf-mood ${info.mood > 0 ? 'pos' : info.mood < 0 ? 'neg' : ''}`}>
          <b>{info.mood > 0 ? '+' : info.mood < 0 ? '−' : '±'}{Math.abs(info.mood).toLocaleString('de-DE')}</b>
          <span>{info.text}<small>Stimmung je Monat{info.ratio != null ? ` · Preis ${Math.round(info.ratio * 100)} % des Richtpreises` : ''}</small></span>
        </div>}
      </div>
    </section>
  );
}
