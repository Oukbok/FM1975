// =============================================================================
// Hallen-Show: Mittelteil – Startseite (Regeln, Teilnehmer, Hallenkader),
// „Nächstes Spiel“ mit kleiner taktischer Entscheidung, Siegerehrung.
// CSS 28-indoor.css (.ix-*).
// =============================================================================
import Icon from '../../components/Icon';
import { INDOOR_MINUTES } from '../../data/indoorHistory';
import type { IndoorResult } from '../../engine/indoor';
import type { IndoorLive, LiveSlot } from '../../engine/indoorLive';
import { KEEPER_OUT_FROM, type IndoorPlan, type IndoorStyle } from '../../engine/indoorMatch';
import type { IndoorOutcome } from '../../game/indoorGame';
import type { Game } from '../../game/state';
import type { IndoorTournament } from '../../game/winterShared';
import type { Player } from '../../types';
import { fmtDM } from '../../ui/format';
import { TrophyArt } from '../../views/verein/trophies/TrophyArt';
import { AnyCrest } from '../../views/transfers/window/parts';
import { IndoorHall } from './IndoorHall';
import { EntrantsPanel, IxClub, SquadPanel, scoreText } from './IndoorPanels';
import { STAGE_LABEL, indoorName } from './indoorScript';

export function IntroStage({ g, t, live, squad, onStart, onAll }: {
  g: Game; t: IndoorTournament; live: IndoorLive; squad: Player[]; onStart: () => void; onAll: () => void;
}) {
  const n = Object.keys(live.strength).length;
  const own = live.slots.filter((s) => s.a === g.managedClubId || s.b === g.managedClubId).length;
  return (
    <div className="ix-intro">
      <div className="ix-facts">
        <div><span className="ix-k">Format</span><b>{n} Teams</b><span className="ix-dim">zwei Gruppen, Halbfinale, Finale</span></div>
        <div><span className="ix-k">Spielzeit</span><b>1 × {INDOOR_MINUTES.group} Min.</b><span className="ix-dim">K.-o.: 2 × {INDOOR_MINUTES.knockout / 2} Min.</span></div>
        <div><span className="ix-k">Spieler</span><b>5 + Torwart</b><span className="ix-dim">fliegender Wechsel, Rundumbande</span></div>
        <div><span className="ix-k">Dein Programm</span><b>{own} Gruppenspiele</b><span className="ix-dim">Remis im K.-o. → Neunmeter</span></div>
      </div>
      <div className="ix-intro-cols">
        <section className="ix-sec">
          <h3 className="ix-h">Teilnehmer<span className="ix-h-note">Hallenstärke</span></h3>
          <div className="ix-scroll"><EntrantsPanel g={g} live={live} /></div>
        </section>
        <section className="ix-sec">
          <h3 className="ix-h">Dein Hallenkader<span className="ix-h-note">{t.squads[g.managedClubId] === 'stars' ? 'Stammkräfte' : t.squads[g.managedClubId] === 'youth' ? 'Nachwuchs' : 'Gemischt'}</span></h3>
          <div className="ix-scroll"><SquadPanel squad={squad} /></div>
        </section>
      </div>
      <div className="ix-actions">
        <button className="ix-btn" onClick={onAll}><Icon name="skip" size={22} /> Alles simulieren</button>
        <button className="ix-btn primary big" onClick={onStart}>Turnier beginnen</button>
      </div>
    </div>
  );
}

const STYLE_TXT: Record<IndoorStyle, [string, string]> = {
  defensiv: ['Defensiv', 'Hinten dicht – weniger Tore auf beiden Seiten.'],
  ausgewogen: ['Ausgewogen', 'Normales Hallenspiel.'],
  offensiv: ['Offensiv', 'Pressing an der Bande – mehr Tore auf beiden Seiten.'],
};

export function NextStage({ g, live, slot, plan, onPlan, year, last, onText, onResult, onOthers }: {
  g: Game; live: IndoorLive; slot: LiveSlot; plan: IndoorPlan; onPlan: (p: IndoorPlan) => void; year: number;
  last?: LiveSlot; onText: () => void; onResult: () => void; onOthers: () => void;
}) {
  const mid = g.managedClubId;
  const own = slot.a === mid || slot.b === mid;
  const ownLeft = live.slots.filter((s) => !s.match && (s.a === mid || s.b === mid)).length;
  const sideBox = (id: string | null) => (
    <div className={`ix-nx-side ${id === mid ? 'me' : ''}`}>
      <span className="ix-nx-crest">{id && <AnyCrest g={g} id={id} size={120} />}</span>
      <span className="ix-nx-name">{id ? indoorName(g, id) : 'offen'}</span>
      {id && <span className="ix-dim">Hallenstärke {Math.round(live.strength[id])}</span>}
    </div>
  );
  const lastLine = last?.match && (
    <div className="ix-last">
      <span className="ix-k">Zuletzt</span>
      <IxClub g={g} id={last.a} size={22} short /><b>{scoreText(last.match)}</b><IxClub g={g} id={last.b} size={22} short />
    </div>
  );
  return (
    <div className="ix-next">
      <div className="ix-nx-head">
        <span className="ix-k">{own ? 'Dein nächstes Spiel' : 'Nächstes Spiel'}</span>
        <span className="ix-nx-stage">{STAGE_LABEL[slot.stage]} · Spiel {slot.no} von {live.slots.length}</span>
      </div>
      <div className="ix-nx-teams">
        <IndoorHall year={year} className="framed" />
        {sideBox(slot.a)}
        <span className="ix-nx-vs">–</span>
        {sideBox(slot.b)}
      </div>
      {own ? (
        <div className="ix-plan">
          <div className="ix-plan-row">
            <span className="ix-k">Ausrichtung</span>
            <div className="seg-group">
              {(Object.keys(STYLE_TXT) as IndoorStyle[]).map((s) => (
                <button key={s} className={`seg-btn ${plan.style === s ? 'active' : ''}`} onClick={() => onPlan({ ...plan, style: s })}>{STYLE_TXT[s][0]}</button>
              ))}
            </div>
            <span className="ix-plan-hint">{STYLE_TXT[plan.style][1]}</span>
          </div>
          <div className="ix-plan-row">
            <span className="ix-k">Einsatz</span>
            <div className="seg-group">
              <button className={`seg-btn ${!plan.block ? 'active' : ''}`} onClick={() => onPlan({ ...plan, block: false })}>Fliegend wechseln</button>
              <button className={`seg-btn ${plan.block ? 'active' : ''}`} onClick={() => onPlan({ ...plan, block: true })}>Stammfünf durchspielen</button>
            </div>
            <span className="ix-plan-hint">{plan.block ? 'Etwas stärker – aber müder und anfälliger für Verletzungen.' : 'Alle sieben Feldspieler rotieren.'}</span>
          </div>
          <div className="ix-plan-row">
            <span className="ix-k">Schlussminute</span>
            {year >= KEEPER_OUT_FROM ? (
              <div className="seg-group">
                <button className={`seg-btn ${!plan.keeperOut ? 'active' : ''}`} onClick={() => onPlan({ ...plan, keeperOut: false })}>Torwart bleibt drin</button>
                <button className={`seg-btn ${plan.keeperOut ? 'active' : ''}`} onClick={() => onPlan({ ...plan, keeperOut: true })}>Torwart raus bei Rückstand</button>
              </div>
            ) : <span className="ix-plan-hint">Torwart rausnehmen ist in dieser Zeit noch unüblich.</span>}
            <span className="ix-plan-hint">{year >= KEEPER_OUT_FROM ? (plan.keeperOut ? 'Liegst du mit ein, zwei Toren hinten, kommt ein fünfter Feldspieler – Risiko leeres Tor.' : '') : ''}</span>
          </div>
        </div>
      ) : (
        <p className="ix-nx-note">{ownLeft ? 'Die übrigen Spiele laufen als Ergebnis durch, bis du wieder dran bist.' : 'Dein Turnier ist beendet – die restlichen Spiele laufen als Ergebnis durch.'}</p>
      )}
      <div className="ix-actions">
        {lastLine}
        <span className="ix-ctrl-gap" />
        {own ? (
          <>
            <button className="ix-btn" onClick={onResult}><Icon name="skip" size={22} /> Nur Ergebnis</button>
            <button className="ix-btn primary big" onClick={onText}>Kurzer Textmodus</button>
          </>
        ) : (
          <button className="ix-btn primary big" onClick={onOthers}>{ownLeft ? 'Weiter bis zu deinem Spiel' : 'Turnier zu Ende spielen'}</button>
        )}
      </div>
    </div>
  );
}

export function CeremonyStage({ g, t, res, out, onClose }: { g: Game; t: IndoorTournament; res: IndoorResult; out?: IndoorOutcome; onClose: () => void }) {
  const mid = g.managedClubId;
  const champ = res.ranking[0];
  const fin = res.matches.find((m) => m.stage === 'F');
  const won = champ === mid;
  const fan = out ? Math.round(out.fan * 10) / 10 : 0;
  return (
    <div className="ix-cer">
      <div className="ix-cer-l">
        <IndoorHall year={parseInt(t.date.slice(0, 4), 10)} className="framed" />
        <div className="ix-cer-trophy"><TrophyArt shape="halle" /></div>
        <div className="ix-k">Turniersieger</div>
        <div className={`ix-cer-champ ${won ? 'me' : ''}`}>
          <AnyCrest g={g} id={champ} size={64} />
          <span>{indoorName(g, champ)}</span>
        </div>
        {fin && <div className="ix-dim ix-cer-fin">Finale {indoorName(g, fin.a)} – {indoorName(g, fin.b)} {scoreText(fin)}</div>}
      </div>
      <div className="ix-cer-m">
        <h3 className="ix-h">Endstand</h3>
        <div className="rl rl-sm ix-scroll">
          {res.ranking.map((id, i) => (
            <div key={id} className={`rl-row ix-erow ${id === mid ? 'me' : ''}`}>
              <span className="rl-rank">{i + 1}.</span>
              <IxClub g={g} id={id} size={26} />
            </div>
          ))}
        </div>
      </div>
      <div className="ix-cer-r">
        <h3 className="ix-h">Dein Turnier</h3>
        {out ? (
          <div className="ix-cer-facts">
            <div><span className="ix-k">Platz</span><b>{out.place + 1}.</b></div>
            <div><span className="ix-k">Einnahmen</span><b>{fmtDM(out.money)}</b><span className="ix-dim">Antrittsgeld{out.place === 0 ? ' + Siegprämie' : ''}</span></div>
            <div><span className="ix-k">Fan-Stimmung</span><b className={fan > 0 ? 'pos' : fan < 0 ? 'neg' : ''}>{fan > 0 ? '+' : ''}{fan.toLocaleString('de-DE')}</b>
              <span className="ix-dim">{t.kind === 'masters' && won ? 'Masters-Titel' : fan > 0 ? 'Heimturnier' : 'unverändert'}</span></div>
            <div><span className="ix-k">Frische</span><b>{Math.round(out.frische[0])} → {Math.round(out.frische[1])}</b><span className="ix-dim">Ø der {out.players} Hallenspieler</span></div>
            <div className="ix-cer-inj">
              <span className="ix-k">Verletzungen</span>
              {out.injured.length ? out.injured.map((x) => <span key={x} className="neg">{x}</span>) : <span className="ix-dim">Keine – Glück gehabt auf dem harten Boden.</span>}
            </div>
          </div>
        ) : <p className="ix-dim">Dein Verein war nicht dabei.</p>}
        <div className="ix-actions">
          <span className="ix-ctrl-gap" />
          <button className="ix-btn primary big" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  );
}
