import { useMemo } from 'react';
import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import PlayerAvatar from '../../components/PlayerAvatar';
import { CountryFlag } from '../../components/competition/CountryFlag';
import { NATIONALITIES } from '../../data/countryFlags';
import { ManagerBackground, ManagerStyle, Player } from '../../types';
import {
  BG_DE, birthYearsFor, DIFF_DE, MONTHS, NewGameDraft, STYLE_DE, ageAtStart, allPreviewClubs, daysInMonth, fullName, managerFace,
} from './draft';
import Select from '../../ui/Select';

// Schritt 1: Manager — Persönliches, Porträt, Trainerprofil, Vereine, Schwierigkeit
const FLAG_OF: Record<string, string> = { Österreich: 'Oesterreich', Dänemark: 'Daenemark', Türkei: 'Tuerkei', Rumänien: 'Rumaenien' };

function ClubSelect({ value, onChange, exclude }: { value: string; onChange: (v: string) => void; exclude?: string }) {
  const clubs = useMemo(() => allPreviewClubs(), []);
  const sel = clubs.find((c) => c.id === value);
  return (
    <div className="ng-clubsel">
      <span className="ng-clubsel-crest">{sel ? <ClubCrest club={sel.club} size={30} /> : <span className="ng-crest-empty" />}</span>
      <Select className="ng-sel" size="l" value={value} onChange={(v) => onChange(v)}>
        <option value="">keiner</option>
        {clubs.filter((c) => c.id !== exclude).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.tier === 1 ? '1. Liga' : '2. Liga'})</option>)}
      </Select>
    </div>
  );
}

export function StepManager({ d, set }: { d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void }) {
  const age = ageAtStart(d);
  const face = managerFace(d.avatarSeed, fullName(d)) as unknown as Player;
  const reroll = () => set({ avatarSeed: Math.random().toString(36).slice(2, 8) });
  return (
    <div className="ng-cols ng-cols-mgr">
      <section className="ng-card">
        <h3 className="ng-h">Persönliches</h3>
        <div className="ng-person">
          <div className="ng-fields">
            <label className="ng-field">Vorname
              <input className="ng-input" autoFocus value={d.firstName} maxLength={24} placeholder="z. B. Max" onChange={(e) => set({ firstName: e.target.value })} />
            </label>
            <label className="ng-field">Nachname
              <input className="ng-input" value={d.lastName} maxLength={28} placeholder="z. B. Mustermann" onChange={(e) => set({ lastName: e.target.value })} />
            </label>
            <div className="ng-field">Geburtsdatum
              <div className="ng-date">
                <Select className="ng-sel" size="l" value={d.birthDay} onChange={(v) => set({ birthDay: +v })}>
                  {Array.from({ length: daysInMonth(d.birthYear, d.birthMonth) }, (_, i) => <option key={i} value={i + 1}>{i + 1}.</option>)}
                </Select>
                <Select className="ng-sel" size="l" value={d.birthMonth} onChange={(v) => set({ birthMonth: +v })}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </Select>
                <Select className="ng-sel" size="l" value={d.birthYear} onChange={(v) => set({ birthYear: +v })}>
                  {birthYearsFor(d.startYear).map((y) => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
            </div>
          </div>
          <div className="ng-portrait">
            <PlayerAvatar player={{ ...face, age }} size={150} staff year={d.startYear} />
            <button type="button" className="ng-btn small ghost" onClick={reroll}><Icon name="dice" size={16} /> Anderes Gesicht</button>
          </div>
        </div>
        <div className="ng-kv"><span>Alter beim Start (1. Juli {d.startYear})</span><b>{age} Jahre</b></div>
        <label className="ng-field">Nationalität
          <span className="ng-with-flag"><CountryFlag country={FLAG_OF[d.nationality] ?? d.nationality} height={14} />
            <Select className="ng-sel" size="l" value={d.nationality} onChange={(v) => set({ nationality: v })}>
              {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
            </Select></span>
        </label>
        <label className="ng-field">Zweite Nationalität
          <Select className="ng-sel" size="l" value={d.nationality2} onChange={(v) => set({ nationality2: v })}>
            <option value="">keine</option>
            {NATIONALITIES.filter((n) => n !== d.nationality).map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </label>
      </section>

      <section className="ng-card">
        <h3 className="ng-h">Trainerprofil</h3>
        <div className="ng-sublabel">Bevorzugter Spielstil</div>
        <div className="ng-seg">
          {(Object.keys(STYLE_DE) as ManagerStyle[]).map((s) => (
            <button key={s} type="button" className={d.style === s ? 'on' : ''} onClick={() => set({ style: s })}>{STYLE_DE[s]}</button>
          ))}
        </div>
        <div className="ng-sublabel">Werdegang</div>
        <div className="ng-opts">
          {(Object.keys(BG_DE) as ManagerBackground[]).map((b) => (
            <button key={b} type="button" className={`ng-opt ${d.background === b ? 'on' : ''}`} onClick={() => set({ background: b })}>
              <b>{BG_DE[b].label}</b><small>{BG_DE[b].desc}</small>
            </button>
          ))}
        </div>
        <div className="ng-sublabel">Schwierigkeitsgrad</div>
        <div className="ng-seg">
          {DIFF_DE.map(([k, l]) => <button key={k} type="button" className={d.difficulty === k ? 'on' : ''} onClick={() => set({ difficulty: k })}>{l}</button>)}
        </div>
        <p className="ng-note">{DIFF_DE.find(([k]) => k === d.difficulty)?.[2]}. Spielstil und Werdegang beschreiben dich im Profil.</p>
      </section>

      <section className="ng-card">
        <h3 className="ng-h">Deine Vereine</h3>
        <label className="ng-field">Lieblingsverein
          <ClubSelect value={d.favoriteClubId} onChange={(v) => set({ favoriteClubId: v })} exclude={d.avoidClubId} />
        </label>
        <label className="ng-field">Niemals trainieren würde ich
          <ClubSelect value={d.avoidClubId} onChange={(v) => set({ avoidClubId: v })} exclude={d.favoriteClubId} />
        </label>
        <p className="ng-note">Beides steht in deinem Trainerprofil. Der „Niemals“-Verein taucht im Karrieremodus nicht unter den Angeboten auf.
          Angebote anderer Vereine während der Karriere gibt es noch nicht – du führst deinen Verein durch die Jahrzehnte.</p>
      </section>
    </div>
  );
}
