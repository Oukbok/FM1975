// =============================================================================
// SPIELERGESPRÄCH — Popup als aufgeschlagenes Buch (Vorbild: „Spielergespräch“)
// -----------------------------------------------------------------------------
// Links der Spieler (TalkLeft), rechts Themenwahl → Antwort des Spielers.
// Logik: game/playerTalk.ts (nutzt das Kabinen-Gespräch `talkTo`).
// Einstiege: Kader › Kabine (Spieler im Fokus), Kader › Übersicht (Knopf je Zeile).
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TalkKind } from '../../../engine/dressingRoom';
import { roomOf, squadOf, talkState, talkWeek } from '../../../game/dressingRoomGame';
import { holdTalk, talkBlock, talkTopics, TalkOutcome } from '../../../game/playerTalk';
import { Game } from '../../../game/state';
import { InfoTip, openWiki } from '../../../ui/InfoTip';
import { MoraleAnim, TalkLeft } from './TalkLeft';
import { Glyph } from './TalkScene';

const RULED_LINES = 11;

export function PlayerTalkModal({ g, pid, onClose, onChange }: { g: Game; pid: string; onClose: () => void; onChange?: () => void }) {
  const club = g.clubs[g.managedClubId];
  const ids = useMemo(() => squadOf(g, club).sort((a, b) => a.shirtNumber - b.shirtNumber).map((p) => p.id), [g, club]);
  const [cur, setCur] = useState(pid);
  const [topic, setTopic] = useState<TalkKind | null>(null);
  const [out, setOut] = useState<TalkOutcome | null>(null);
  const [anim, setAnim] = useState<MoraleAnim | undefined>();
  const [said, setSaid] = useState('');
  const p = g.players[cur];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!p) return null;
  const go = (d: number) => {
    const i = ids.indexOf(cur);
    const next = ids[(i + d + ids.length) % ids.length];
    if (next) { setCur(next); setTopic(null); setOut(null); setAnim(undefined); }
  };
  const topics = out ? [] : talkTopics(g, cur);
  const block = out ? undefined : talkBlock(g, cur);
  const wk = talkWeek(g);
  const ts = talkState(g, cur);
  const pledge = roomOf(club).pledges?.find((x) => x.pid === cur);
  const say = () => {
    if (!topic) return;
    setSaid(topics.find((t) => t.kind === topic)?.say ?? '');
    const r = holdTalk(g, cur, topic);
    setOut(r);
    if (r.ok) setAnim({ from: r.before, to: r.after, key: Date.now() });
    onChange?.();
  };
  const phase = !out?.ok ? 'talk' : out.success ? 'ok' : 'fail';
  const chosen = topics.find((t) => t.kind === topic);
  const left = out ? wk.left : Math.max(0, wk.left - 1);

  // Portal in den skalierten Anzeigebereich: Boxen mit Filter/Transform würden das feste Overlay sonst einsperren.
  const host = (typeof document !== 'undefined' && (document.querySelector('.display-content') ?? document.body)) as Element;
  return createPortal(
    <div className="modal-overlay ptk-overlay" onClick={onClose}>
      <div className="ptk-book" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Spielergespräch mit ${p.fullName}`}>
        <TalkLeft p={p} club={club} phase={phase} anim={anim} />
        <div className="ptk-spine" aria-hidden="true" />
        <section className="ptk-page ptk-right">
          <div className="ptk-tools">
            <button className="ptk-round" onClick={() => go(-1)} aria-label="Vorheriger Spieler" title="Vorheriger Spieler"><Glyph name="prev" /></button>
            <button className="ptk-round" onClick={() => go(1)} aria-label="Nächster Spieler" title="Nächster Spieler"><Glyph name="next" /></button>
            <button className="ptk-round" onClick={() => { if (openWiki('condition-kabine')) onClose(); }} aria-label="Wiki: Kabine und Gespräche" title="Wiki: Kabine und Gespräche"><Glyph name="info" /></button>
            <button className="ptk-round ptk-x modal-close" onClick={onClose} aria-label="Schließen" title="Schließen"><Glyph name="close" /></button>
          </div>
          <h2 className="ptk-title">Spielergespräch</h2>

          {!out?.ok ? <>
            <p className="ptk-lead">Wähle das Thema für das Gespräch mit {p.firstName || p.lastName}!</p>
            <div className="ptk-topics">
              <div className="ptk-topics-h"><span>Gesprächsthema</span><span>Einschätzung</span></div>
              {topics.map((t) => (
                <button key={t.kind} className={`ptk-topic${topic === t.kind ? ' on' : ''}`} disabled={!!block}
                  onClick={() => setTopic(t.kind)} aria-pressed={topic === t.kind}>
                  <span className="ptk-say">{t.say}</span>
                  <span className={`ptk-hint${t.needed ? '' : ' dim'}`}>{t.hint}</span>
                </button>
              ))}
              {Array.from({ length: Math.max(0, RULED_LINES - topics.length) }, (_, i) => <div key={i} className="ptk-ruled" />)}
            </div>
            <div className="ptk-note">
              {block ?? (chosen ? chosen.info : 'Die Einschätzung stammt von deinem Trainerteam – sicher ist nichts.')}
              {!block && ts.count > 0 && <> Ihr habt in den letzten 60 Tagen {ts.count === 1 ? 'einmal' : `${ts.count}-mal`} gesprochen – Wirkung {Math.round(ts.wear * 100)} %.</>}
              {!block && pledge && <> Einsatz zugesagt bis {pledge.until.split('-').reverse().join('.')}.</>}
            </div>
          </> : <TalkAnswer out={out} say={said} name={p.lastName} />}

          <div className="ptk-week">
            {out?.ok ? `In dieser Woche hast du noch Zeit für ${left} weitere${left === 1 ? 's' : ''} Treffen.`
              : block && wk.left <= 0 ? `Diese Woche: ${wk.used} von ${wk.limit} Treffen geführt.`
                : `Danach hast du in dieser Woche noch Zeit für ${left} weitere${left === 1 ? 's' : ''} Treffen.`}
            <InfoTip k="gespraeche" />
          </div>
          <div className="ptk-actions">
            {!out?.ok ? <>
              <button className="ptk-act main" disabled={!topic || !!block} onClick={say}><span className="ptk-act-ico"><Glyph name="check" size={16} /></span>Dem Spieler das sagen</button>
              <button className="ptk-act" onClick={onClose}><span className="ptk-act-ico"><Glyph name="cross" size={14} /></span>Abbrechen</button>
            </> : <>
              <button className="ptk-act main" onClick={() => go(1)}><span className="ptk-act-ico"><Glyph name="next" size={16} /></span>Nächster Spieler</button>
              <button className="ptk-act" onClick={onClose}><span className="ptk-act-ico"><Glyph name="cross" size={14} /></span>Schließen</button>
            </>}
          </div>
          {out && !out.ok && <div className="ptk-note">{out.text}</div>}
        </section>
      </div>
    </div>,
    host,
  );
}

function TalkAnswer({ out, say, name }: { out: TalkOutcome; say: string; name: string }) {
  const d = Math.round(out.after) - Math.round(out.before);
  return (
    <div className="ptk-answer">
      <div className="ptk-said"><span className="ptk-who">Du</span><span>„{say}“</span></div>
      <div className="ptk-reply"><span className="ptk-who">{name}</span><blockquote>„{out.quote}“</blockquote></div>
      <div className="ptk-gesture">{out.gesture}</div>
      <div className="ptk-effects">
        <span className={`ptk-eff ${d > 0 ? 'up' : d < 0 ? 'down' : ''}`}>Moral {d > 0 ? `+${d}` : d === 0 ? '±0' : d}</span>
        {out.effects.map((e) => <span key={e} className="ptk-eff">{e}</span>)}
      </div>
      <div className="ptk-note">{out.success ? (out.needed ? 'Das Gespräch ist angekommen.' : 'Freundlich aufgenommen – nötig war es gerade kaum.') : 'Das Gespräch ist nicht gut angekommen.'} Die Moral gleitet in den nächsten Tagen wieder zu ihrem Zielwert.</div>
    </div>
  );
}
