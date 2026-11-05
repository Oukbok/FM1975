// =============================================================================
// Schlichtes Vereinsprofil für Auslandsvereine (`eu_*`, Weltdaten `w_*`), die das
// große Vereinsprofil (ClubModal) nicht darstellen kann: Name, Land, Stadt, Liga,
// Stärke, Meistertitel, Europapokal dieser Saison. Geöffnet über <ClubLink> wie
// jedes andere Profil (club/ClubProfileContext.tsx). Feste Fenstergröße.
// =============================================================================
import { useEffect } from 'react';
import type { Game } from '../../game/state';
import { DashBox, KV } from '../../ui/DashPage';
import { vColor } from '../../ui/format';

export const hasForeignProfile = (g: Game, id: string | null | undefined) => !!id && !!g.euroClubs?.[id];

function leagueOf(g: Game, id: string): { country: string; tier: number | null; titles: number; champion: boolean } {
  for (const c of Object.values(g.world?.countries ?? {})) {
    const t = c.tiers.findIndex((l) => l.includes(id));
    if (t >= 0) return { country: c.name, tier: t + 1, titles: c.titles[id] ?? 0, champion: c.lastChampion === id };
  }
  return { country: g.euroClubs?.[id]?.country ?? '', tier: null, titles: 0, champion: false };
}

const COMP_DE: Record<string, string> = { ec: 'Europapokal der Landesmeister', cwc: 'Europapokal der Pokalsieger', uefa: 'UEFA-Pokal', cl: 'Champions League', el: 'Europa League', ecl: 'Conference League' };

export default function ForeignClubModal({ g, clubId, onClose, zIndex }: { g: Game; clubId: string; onClose: () => void; zIndex?: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const c = g.euroClubs![clubId];
  const lg = leagueOf(g, clubId);
  const strength = Math.round(c.strength);
  const comps = Object.entries(g.world?.participants ?? {}).filter(([, ids]) => ids.includes(clubId)).map(([k]) => COMP_DE[k] ?? k);
  return (
    <div className="modal-overlay cmx-overlay" onClick={onClose} style={zIndex ? { zIndex } : undefined}>
      <div className="modal modal-xl cmx-modal fcm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head cmx-head" style={{ ['--club' as string]: c.colors.primary }}>
          <span className="fcm-crest" style={{ background: c.colors.primary, borderColor: c.colors.secondary }}>{c.shortName}</span>
          <div className="cmx-id">
            <div className="mx-sub">{[c.city, lg.country || c.country, lg.tier ? `${lg.tier}. Liga` : null].filter(Boolean).join(' · ')}</div>
            <h2>{c.name}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mx-body fcm-body">
          <DashBox title="Steckbrief">
            <KV k="Land" v={lg.country || c.country} />
            <KV k="Stadt" v={c.city} />
            <KV k="Liga" v={lg.tier ? `${lg.tier}. Liga ${lg.country}` : 'Auslandsverein'} />
            <KV k="Spielstärke" v={strength} color={vColor(strength)} />
            <KV k="Meistertitel (seit Spielbeginn)" v={lg.titles} />
            {lg.champion && <KV k="Status" v="amtierender Meister" />}
            <KV k="Europapokal" v={comps.length ? comps.join(', ') : '—'} />
          </DashBox>
          <p className="dnote fcm-note">Auslandsvereine laufen im Hintergrund mit: Kader, Finanzen und Historie werden nicht einzeln geführt.</p>
        </div>
      </div>
    </div>
  );
}
