import { useState } from 'react';
import { yearOf } from '../../engine/economy';
import { ensureMerchShop } from '../../game/merchGame';
import { Game } from '../../game/state';
import { DashPage, DashBox, Empty } from '../../ui/DashPage';
import { MerchGeneral } from './merch/MerchGeneral';
import { MerchStats } from './merch/MerchStats';
import type { MerchTab } from './merch/parts';

// =============================================================================
// FANARTIKEL (Finanzen › Fanartikel) — Vorbild EA FM „Fans und Fanartikel › Merchandise“:
// Reiter Allgemein (Sortiment, Übersicht, Artikel/Einkauf, Lager, Nachfrage) und
// Statistiken (je Artikel, Umsatzentwicklung, Trikots/Poster je Spieler).
// Logik: game/merchGame.ts, engine/merch.ts · Sortiment/Quellen: data/merchCatalog.ts
// =============================================================================
export function MerchView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [tab, setTab] = useState<MerchTab>(() => {
    try { return (localStorage.getItem('fm1975.merchTab') as MerchTab) || 'allgemein'; } catch { return 'allgemein'; }
  });
  const pick = (t: MerchTab) => { setTab(t); try { localStorage.setItem('fm1975.merchTab', t); } catch { /* egal */ } };
  const club = g.clubs[g.managedClubId];
  const shop = ensureMerchShop(g);
  const year = yearOf(g.calendar.currentDate);
  if (!shop || !club) return <DashPage><DashBox title="Fanartikel" span={3} rows={2}><Empty>Kein Verein.</Empty></DashBox></DashPage>;
  const p = { g, club, shop, year, tab, setTab: pick };
  return (
    <DashPage className="mc-page">
      {tab === 'allgemein' ? <MerchGeneral {...p} onChange={onChange} /> : <MerchStats {...p} />}
    </DashPage>
  );
}
