import Icon from '../components/Icon';
import { ROUND_NAMES, nextPlayerTie } from '../engine/cup';
import { computeMonthly } from '../engine/finances';
import { Game } from '../game/state';
import { Screen } from '../shell/navigation';
import { renderStars } from '../types';
import { fmtDM } from '../ui/format';
import { MatchLine, NextMatchCard } from './zentrale/Dashboard';

// =============================================================================
// KATEGORIE-DASHBOARDS & NEUE EINZELSEITEN
// =============================================================================
// Kompakte Übersichtsseiten je Hauptkategorie (Reihe-1-Klick) sowie neue,
// eigenständige bzw. rudimentäre Seiten. Alle Texte deutsch, Set-C-Icons.
export const TAC_STYLE_DE: Record<string, string> = {
  defensive: 'Defensiv', balanced: 'Ausgewogen', attacking: 'Offensiv', counter: 'Konter',
};

// --- SPIELTAG ---------------------------------------------------------------
export function SpieltagDashboard({ g, onGoto, onWatch }: {
  g: Game; onGoto: (s: Screen) => void; onWatch: (id: string) => void;
}) {
  const myClub = g.clubs[g.managedClubId];
  const t = myClub.tactics;
  const nextMatch = g.fixtures.find((m) => m.status === 'scheduled' && m.involvesPlayerClub);
  const lastPlayed = [...g.fixtures].reverse().find((m) => m.status === 'finished' && m.involvesPlayerClub);
  const xiCount = t.startingXI.filter(Boolean).length;
  return (
    <div className="dashx-cat">
        <div className="card hoverable clickable" onClick={() => onGoto('lineup')}>
          <div className="card-title"><span className="ico"><Icon name="lineup" /></span> Aufstellung</div>
          <div className="row mt8"><span className="dim">Formation</span><b className="accent-text">{t.formation}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Startelf</span><b className={xiCount === 11 ? 'green' : 'red'}>{xiCount}/11</b></div>
          <div className="dim2 mini mt8">Startelf & Bank bearbeiten →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('tactics')}>
          <div className="card-title"><span className="ico"><Icon name="tactics" /></span> Taktik</div>
          <div className="row mt8"><span className="dim">Ausrichtung</span><b className="accent-text">{TAC_STYLE_DE[t.style] ?? t.style}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Tempo</span><b>{t.tempo}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Pressing</span><b>{t.pressing}</b></div>
          <div className="dim2 mini mt8">Ausrichtung & Verhalten →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('fixtures')}>
          <div className="card-title"><span className="ico"><Icon name="schedule" /></span> Nächstes Spiel</div>
          {nextMatch ? <NextMatchCard g={g} m={nextMatch} /> : <div className="dim">Kein weiteres Spiel.</div>}
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('fixtures')}>
          <div className="card-title"><span className="ico">✓</span> Letztes Ergebnis</div>
          {lastPlayed ? <MatchLine g={g} m={lastPlayed} onWatch={onWatch} /> : <div className="dim">Noch kein Spiel absolviert.</div>}
          <div className="dim2 mini mt12">Gesamten Spielplan öffnen →</div>
        </div>
    </div>
  );
}

// --- KADER ------------------------------------------------------------------
export function KaderDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const squad = myClub.playerIds.map((id) => g.players[id]);
  const avg = squad.length ? Math.round(squad.reduce((s, p) => s + p.overall, 0) / squad.length) : 0;
  const top5 = [...squad].sort((a, b) => b.overall - a.overall).slice(0, 5);
  const talents = [...squad].filter((p) => p.age <= 21).sort((a, b) => b.potentialStars - a.potentialStars).slice(0, 4);
  const injured = squad.filter((p) => p.availability === 'injured');
  const suspended = squad.filter((p) => p.suspensionMatches > 0);
  const youthCount = myClub.youthPlayerIds.length;
  return (
    <div className="dashx-cat">
        <div className="card hoverable clickable" onClick={() => onGoto('squad')}>
          <div className="card-title"><span className="ico"><Icon name="squad" /></span> Übersicht</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
            <div><div className="big-num" style={{ fontSize: 28 }}>{squad.length}</div><div className="dim mini">Spieler</div></div>
            <div><div className="big-num accent-text" style={{ fontSize: 28 }}>{avg}</div><div className="dim mini">Ø Stärke</div></div>
          </div>
          <div className="mt12">
            {top5.map((p) => (
              <div key={p.id} className="row" style={{ padding: '3px 0' }}>
                <span className="pos-badge">{p.naturalPosition}</span>
                <span style={{ flex: 1, marginLeft: 8 }}>{p.lastName}</span>
                <b className="accent-text">{p.overall}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('vertraege')}>
          <div className="card-title"><span className="ico"><Icon name="contracts" /></span> Verträge</div>
          <div className="dim mini mt8">Laufzeiten & Gehälter des A-Kaders verwalten.</div>
          <div className="row mt12"><span className="dim">Kaderspieler</span><b>{squad.length}</b></div>
          <div className="dim2 mini mt8">Zur Vertragsübersicht →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('training')}>
          <div className="card-title"><span className="ico"><Icon name="training" /></span> Training</div>
          <div className="dim mini mt8">Talente (≤ 21 Jahre):</div>
          {talents.length ? talents.map((p) => (
            <div key={p.id} className="row" style={{ padding: '3px 0' }}>
              <span style={{ flex: 1 }}>{p.lastName} <span className="dim2 mini">({p.age})</span></span>
              <b className="accent-text">{renderStars(p.potentialStars)}</b>
            </div>
          )) : <div className="dim mini">Keine jungen Spieler im Kader.</div>}
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('youth')}>
          <div className="card-title"><span className="ico"><Icon name="youth" /></span> Jugend</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
            <div><div className="big-num" style={{ fontSize: 28 }}>{youthCount}</div><div className="dim mini">im NLZ</div></div>
            <div><div className="big-num red" style={{ fontSize: 28 }}>{injured.length}</div><div className="dim mini">Verletzt</div></div>
            <div><div className="big-num red" style={{ fontSize: 28 }}>{suspended.length}</div><div className="dim mini">Gesperrt</div></div>
          </div>
          <div className="dim2 mini mt12">Jugendakademie öffnen →</div>
        </div>
    </div>
  );
}

// --- TRANSFERS --------------------------------------------------------------
export function TransfersDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const fin = myClub.finances;
  return (
    <div className="dashx-cat">
        <div className="card hoverable clickable" onClick={() => onGoto('transfers')}>
          <div className="card-title"><span className="ico"><Icon name="transfers" /></span> Transfermarkt</div>
          <div className="row mt8"><span className="dim">Transferbudget</span><b className="green">{fmtDM(fin.transferBudget)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Kontostand</span><b className={fin.balance >= 0 ? 'green' : 'red'}>{fmtDM(fin.balance)}</b></div>
          <div className="dim2 mini mt8">Spieler suchen & Angebote abgeben →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('beobachtung')}>
          <div className="card-title"><span className="ico"><Icon name="watchlist" /></span> Beobachtungsliste</div>
          <div className="dim mini mt8">Merke dir interessante Spieler und behalte ihre Entwicklung im Blick.</div>
          <div className="dim2 mini mt12">Beobachtungsliste öffnen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('verhandlungen')}>
          <div className="card-title"><span className="ico"><Icon name="negotiations" /></span> Aktive Verhandlungen</div>
          <div className="dim mini mt8">Laufende Vertrags- und Transfergespräche im Überblick.</div>
          <div className="dim2 mini mt12">Verhandlungen öffnen →</div>
        </div>
    </div>
  );
}

// --- FINANZEN ---------------------------------------------------------------
export function FinanzenDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const fin = myClub.finances;
  const m = computeMonthly(myClub, g.players, g.table);
  return (
    <div className="dashx-cat">
        <div className="card hoverable clickable" onClick={() => onGoto('finances')}>
          <div className="card-title"><span className="ico"><Icon name="finances" /></span> Bilanz</div>
          <div className="row mt8"><span className="dim">Kontostand</span><b className={fin.balance >= 0 ? 'green' : 'red'}>{fmtDM(fin.balance)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Monatssaldo</span><b className={m.net >= 0 ? 'green' : 'red'}>{fmtDM(m.net)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Gehälter/Monat</span><b className="red">{fmtDM(m.wages + m.staffWages)}</b></div>
          <div className="dim2 mini mt8">Detaillierte Bilanz öffnen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('sponsoring')}>
          <div className="card-title"><span className="ico"><Icon name="sponsoring" /></span> Sponsoring</div>
          <div className="row mt8"><span className="dim">Einnahmen/Monat</span><b className="green">{fmtDM(m.sponsorship)}</b></div>
          <div className="dim2 mini mt12">Sponsoren-Übersicht öffnen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('marketing')}>
          <div className="card-title"><span className="ico"><Icon name="marketing" /></span> Marketing</div>
          <div className="dim mini mt8">Werbeflächen, Merchandising und Kampagnen steuern.</div>
          <div className="dim2 mini mt12">Marketing öffnen →</div>
        </div>
    </div>
  );
}

// --- VEREIN -----------------------------------------------------------------
export function VereinDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const infra = myClub.infrastructure;
  return (
    <div className="dashx-cat">
        <div className="card hoverable clickable" onClick={() => onGoto('staff')}>
          <div className="card-title"><span className="ico"><Icon name="staff" /></span> Mitarbeiter</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
            <div><div className="big-num" style={{ fontSize: 28 }}>{g.hiredStaff.length}</div><div className="dim mini">angestellt</div></div>
          </div>
          <div className="dim2 mini mt12">Trainer- & Funktionsteam →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('facilities')}>
          <div className="card-title"><span className="ico"><Icon name="facilities" /></span> Vereinsgelände</div>
          <div className="row mt8"><span className="dim">Trainingszentrum</span><b>Stufe {infra.trainingCenter}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Jugendakademie</span><b>Stufe {infra.youthAcademy}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Medizin</span><b>Stufe {infra.medical}</b></div>
          <div className="dim2 mini mt8">Ausbaustufen verwalten →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('stadium')}>
          <div className="card-title"><span className="ico"><Icon name="stadium" /></span> Stadion</div>
          <div className="row mt8"><span className="dim">{myClub.stadium.name}</span></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Kapazität</span><b className="accent-text">{myClub.stadium.capacity.toLocaleString('de-DE')}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ausbaustufe</span><b>Stufe {infra.stadium}</b></div>
          <div className="dim2 mini mt8">Stadion ausbauen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('fans')}>
          <div className="card-title"><span className="ico"><Icon name="fans" /></span> Fans</div>
          <div className="row mt8"><span className="dim">Ø Auslastung</span><b className="accent-text">{Math.round(myClub.stadium.averageAttendanceRate * 100)}%</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ansehen</span><b>{myClub.reputation}</b></div>
          <div className="dim2 mini mt8">Fan-Stimmung öffnen →</div>
        </div>
    </div>
  );
}

// --- STATISTIKEN ------------------------------------------------------------
export function StatistikenDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const myRow = g.table.rows.find((r) => r.clubId === g.managedClubId);
  const cup = g.cup;
  const myTie = cup ? nextPlayerTie(cup, g.managedClubId) : null;
  return (
    <div className="dashx-cat">
        <div className="card hoverable clickable" onClick={() => onGoto('table')}>
          <div className="card-title"><span className="ico"><Icon name="stats" /></span> Liga</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
            <span className="big-num accent-text">{myRow?.position ?? '-'}.</span>
            <span className="dim">Platz · <b style={{ color: 'var(--text)' }}>{myRow?.points ?? 0}</b> Pkt.</span>
          </div>
          <div className="row mt12"><span className="dim">Bilanz</span><b>{myRow?.won ?? 0}-{myRow?.drawn ?? 0}-{myRow?.lost ?? 0}</b></div>
          <div className="dim2 mini mt8">Ganze Tabelle öffnen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('cup')}>
          <div className="card-title"><span className="ico"><Icon name="trophy" /></span> Pokal</div>
          {cup && myTie ? (
            <div className="dim mini mt8">Nächste Runde: <b style={{ color: 'var(--text)' }}>{ROUND_NAMES[myTie.round] ?? 'Pokal'}</b></div>
          ) : (
            <div className="dim mini mt8">Aktuell kein aktives Pokalspiel.</div>
          )}
          <div className="dim2 mini mt12">Pokalwettbewerb öffnen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('international')}>
          <div className="card-title"><span className="ico"><Icon name="international" /></span> International</div>
          <div className="dim mini mt8">Europapokal-Ergebnisse und internationale Wettbewerbe.</div>
          <div className="dim2 mini mt12">International öffnen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('chronicle')}>
          <div className="card-title"><span className="ico"><Icon name="chronicle" /></span> Chronik</div>
          <div className="dim mini mt8">Meilensteine, Titel und Vereinsgeschichte.</div>
          <div className="dim2 mini mt12">Chronik öffnen →</div>
        </div>
    </div>
  );
}
