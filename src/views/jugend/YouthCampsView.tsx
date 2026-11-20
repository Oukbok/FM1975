// =============================================================================
// JUGEND › JUGENDCAMPS (Wunsch Pascal: Jugendcamps in fremden Ländern bauen)
//   Weltkarte der Standorte | Standort mit Stufen, Kosten, Regeln | Talente in
//   den Camps mit „Übernehmen“. Logik game/youthCamps.ts, Daten data/youthCampSites.ts.
// =============================================================================
import { useState } from 'react';
import PosBadge from '../../components/PosBadge';
import { NatFlag } from '../../components/competition/CountryFlag';
import { StarRating } from '../../components/StarRating';
import { CAMP_LEVELS, CAMP_SITES, CAMP_SITE_BY_ID, MAX_CAMPS, joinAge } from '../../data/youthCampSites';
import { ORIGINS, homeNationality } from '../../data/origins';
import { cityGeo } from '../../data/prematch/cityGeo';
import { CalendarEngine } from '../../engine/calendar';
import { yearOf } from '../../engine/economy';
import {
  buildCamp, buildCost, campAt, campsMonthlyTag, closeCamp, kidAge, kidReady, levelDef, levelOpen, monthlyCost, siteFrom, takeKid,
} from '../../game/youthCamps';
import type { Game } from '../../game/state';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { fmtPrice } from '../../ui/format';
import { CampWorldMap, type MapSite } from './camps/CampWorldMap';

const talentWord = (t: number) => (t >= 0.25 ? 'sehr hoch' : t >= 0.15 ? 'hoch' : t >= 0.05 ? 'mittel' : 'normal');

export function YouthCampsView({ g, onChange = () => {} }: { g: Game; onChange?: () => void }) {
  const [, setTick] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const today = g.calendar.currentDate, year = yearOf(today);
  const camps = g.youthCamps?.camps ?? [];
  const homeNat = homeNationality();
  const sites = CAMP_SITES.filter((s) => ORIGINS[s.id]?.nationality !== homeNat);
  const [sel, setSel] = useState<string>(camps[0]?.site ?? sites.find((s) => year >= siteFrom(s))?.id ?? sites[0].id);
  const site = CAMP_SITE_BY_ID[sel] ?? sites[0];
  const camp = campAt(g, site.id);
  const refresh = (err: string | null, ok: string) => { setMsg(err ?? ok); setConfirmClose(false); setTick((x) => x + 1); onChange(); };
  const mine = g.clubs[g.managedClubId];
  const homeGeo = cityGeo(mine?.city)?.geo;

  const mapSites: MapSite[] = sites.map((s) => {
    const c = campAt(g, s.id);
    return { s, state: c ? 'own' : year >= siteFrom(s) ? 'open' : 'later', label: c ? `${s.name} · ${c.level ? levelDef(c.level).name : 'im Bau'}` : year >= siteFrom(s) ? s.name : `${s.name} (ab ${siteFrom(s)})` };
  });
  const kids = camps.flatMap((c) => c.kids.map((k) => ({ c, k, s: CAMP_SITE_BY_ID[c.site] }))).filter((x) => x.s)
    .sort((a, b) => Number(kidReady(g, b.s, b.k)) - Number(kidReady(g, a.s, a.k)) || kidAge(b.k, today) - kidAge(a.k, today));
  const age = joinAge(site, today);

  return (
    <DashPage className="ycx-page">
      <DashBox title="Jugendcamps im Ausland" info="jugendcamps" span={2} flush right={`${camps.length} / ${MAX_CAMPS} Camps${campsMonthlyTag(g) > 0 ? ` · Betrieb ${fmtPrice(campsMonthlyTag(g))} im Monat` : ''}`}>
        <CampWorldMap sites={mapSites} selected={site.id} onSelect={(id) => { setSel(id); setMsg(null); setConfirmClose(false); }} homeGeo={homeGeo} />
      </DashBox>

      <DashBox title={site.name} rows={2} right={site.continent}>
        <div className="dnote">{site.note}</div>
        <div className="mt8">
          <KV k="Möglich ab" v={siteFrom(site)} />
          <KV k="Wechsel in deine Jugend" v={`ab ${age} Jahren`} info="fifaMinderjaehrige" />
          <KV k="Talentdichte" v={talentWord(site.talent)} />
          <KV k="Kosten im Land" v={site.cost >= 1.2 ? 'hoch' : site.cost <= 0.75 ? 'niedrig' : 'mittel'} />
          {camp && <KV k="Talente bisher" v={`${camp.total} · übernommen ${camp.joined}`} />}
        </div>
        <div className="dsec mt8">Stufen</div>
        <div className="ycx-levels">
          {CAMP_LEVELS.map((l) => {
            const have = (camp?.level ?? 0) >= l.level;
            const building = camp?.building?.level === l.level;
            const next = (camp?.level ?? 0) + 1 === l.level && !camp?.building;
            const open = levelOpen(site, l.level, year);
            const cost = buildCost(site, l.level, camp?.level ?? 0, year);
            return (
              <div key={l.level} className={`ycx-level ${have ? 'have' : ''}`}>
                <div className="ycx-lv-head"><b>{l.name}</b><span className="muted">{l.talents} Talent{l.talents > 1 ? 'e' : ''} im Jahr</span></div>
                <div className="ycx-lv-desc">{l.desc}</div>
                <div className="ycx-lv-foot">
                  <span className="muted">{fmtPrice(next ? cost.tag : buildCost(site, l.level, l.level - 1, year).tag)} · {fmtPrice(monthlyCost(site, l.level, year).tag)}/Monat · {Math.round(l.days / 30)} Monate Bau</span>
                  {have ? <span className="ycx-state">In Betrieb</span>
                    : building ? <span className="ycx-state">Bau bis {CalendarEngine.formatDate(camp!.building!.done)}</span>
                      : !open ? <span className="ycx-state muted">ab {Math.max(site.from, l.from)}</span>
                        : <button className="b3 b3-s" disabled={!next || (!camp && camps.length >= MAX_CAMPS)}
                          onClick={() => refresh(buildCamp(g, site.id, l.level), `${l.name} in ${site.name} beauftragt.`)}>{camp ? 'Ausbauen' : 'Bauen'}</button>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="ycx-foot">
          <div className="scx-msg dnote" role="status">{msg ?? ''}</div>
          {camp && (confirmClose
            ? <button className="b3 b3-s" onClick={() => { closeCamp(g, site.id); refresh(null, `Camp in ${site.name} geschlossen.`); }}>Wirklich schließen</button>
            : <button className="b3 b3-s" onClick={() => setConfirmClose(true)}>Camp schließen</button>)}
        </div>
      </DashBox>

      <DashBox title="Talente in den Camps" info="campTalente" span={2} flush right={kids.length ? `${kids.length}` : undefined}>
        {kids.length ? (
          <table className="dtable rl-players">
            <thead><tr><th>Name</th><th className="ctr w-s">Land</th><th>Camp</th><th className="ctr">Pos</th><th className="num w-s">Alter</th><th className="w-m">Potenzial</th><th>Wechsel</th><th /></tr></thead>
            <tbody>
              {kids.map(({ c, k, s }) => {
                const ready = kidReady(g, s, k);
                return (
                  <tr key={k.id}>
                    <td className="nowrap rl-name"><b>{k.name}</b></td>
                    <td className="ctr"><NatFlag nat={ORIGINS[s.id]?.nationality ?? ''} /></td>
                    <td className="nowrap">{s.name}{c.level ? '' : ' (im Bau)'}</td>
                    <td className="ctr"><PosBadge pos={k.pos} /></td>
                    <td className="num">{kidAge(k, today)}</td>
                    <td><StarRating lo={k.st[0]} hi={k.st[1]} size={18} label="Potenzial" note="Einschätzung der Trainer im Camp." /></td>
                    <td className="nowrap">{ready ? 'jetzt möglich' : `ab ${joinAge(s, today)} · Sommer ${k.born + joinAge(s, today)}`}</td>
                    <td className="num"><button className="b3 b3-s" disabled={!ready} onClick={() => refresh(takeKid(g, s.id, k.id), `${k.name} wechselt in deine Jugend.`)}>Übernehmen</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <Empty icon="youth">{camps.length ? 'Die Talente kommen jedes Jahr am 1. Juli, sobald ein Camp in Betrieb ist.' : `Noch kein Camp im Ausland. Wähle auf der Karte einen Standort – möglich ab ${Math.min(...sites.map(siteFrom))}.`}</Empty>}
      </DashBox>
    </DashPage>
  );
}
