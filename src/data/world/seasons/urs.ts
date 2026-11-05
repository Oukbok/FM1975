// Ligen Sowjetunion je Saison (Schlüssel = Startjahr). Quellen: docs/recherche/weltvereine_urs.md
import type { SeasonRow } from '../types';

export const SEASONS_URS: Record<number, SeasonRow> = {
  1975: {
    t1: ['urs-kiew', 'urs-donezk', 'urs-moskau-blau', 'urs-leningrad', 'urs-jerewan', 'urs-dnipropetrowsk', 'urs-moskau-schwarz-weiss', 'urs-moskau-rot-blau', 'urs-tiflis', 'urs-moskau-rot-weiss', 'urs-odessa', 'urs-woroschilowgrad', 'urs-lwiw', 'urs-taschkent', 'urs-alma-ata', 'urs-rostow-rot-blau'],
    cup: 'urs-jerewan',
    cupFinalist: 'urs-leningrad',
    euro: { ec: ['urs-kiew'], cwc: ['urs-jerewan'], uefa: ['urs-moskau-blau', 'urs-moskau-schwarz-weiss'] },
    note: "Reihenfolge der Plätze 4–14 unsicher.",
  },
  1976: {
    t1: ['urs-moskau-schwarz-weiss', 'urs-kiew', 'urs-tiflis', 'urs-donezk', 'urs-jerewan', 'urs-moskau-blau', 'urs-leningrad', 'urs-dnipropetrowsk', 'urs-lwiw', 'urs-woroschilowgrad', 'urs-moskau-rot-blau', 'urs-odessa', 'urs-taschkent', 'urs-minsk', 'urs-moskau-rot-weiss', 'urs-kuibyschew'],
    cup: 'urs-tiflis',
    cupFinalist: 'urs-jerewan',
    euro: { ec: ['urs-kiew'], cwc: ['urs-tiflis'], uefa: ['urs-donezk', 'urs-dnipropetrowsk'] },
    note: "1976 zwei Meisterschaften: Frühjahr (Meister Moskau Blau, ohne Abstieg) und Herbst (hier eingetragen, Meister Moskau Schwarz-Weiß).",
  },
  1977: {
    t1: ['urs-kiew', 'urs-tiflis', 'urs-moskau-schwarz-weiss', 'urs-donezk', 'urs-moskau-blau', 'urs-jerewan', 'urs-dnipropetrowsk', 'urs-leningrad', 'urs-moskau-rot-blau', 'urs-odessa', 'urs-woroschilowgrad', 'urs-lwiw', 'urs-baku', 'urs-alma-ata', 'urs-minsk', 'urs-taschkent'],
    cup: 'urs-moskau-blau',
    cupFinalist: 'urs-moskau-schwarz-weiss',
    euro: { ec: ['urs-moskau-schwarz-weiss'], cwc: ['urs-moskau-blau'], uefa: ['urs-kiew', 'urs-tiflis', 'urs-donezk'] },
  },
  1978: {
    t1: ['urs-tiflis', 'urs-kiew', 'urs-donezk', 'urs-moskau-blau', 'urs-moskau-rot-weiss', 'urs-leningrad', 'urs-jerewan', 'urs-moskau-schwarz-weiss', 'urs-moskau-rot-blau', 'urs-baku', 'urs-odessa', 'urs-lwiw', 'urs-alma-ata', 'urs-woroschilowgrad', 'urs-dnipropetrowsk', 'urs-moskau-rot-gruen'],
    cup: 'urs-kiew',
    cupFinalist: 'urs-donezk',
    euro: { ec: ['urs-kiew'], cwc: ['urs-moskau-blau'], uefa: ['urs-tiflis', 'urs-moskau-schwarz-weiss'] },
  },
  1979: {
    t1: ['urs-moskau-rot-weiss', 'urs-donezk', 'urs-kiew', 'urs-tiflis', 'urs-moskau-blau', 'urs-leningrad', 'urs-jerewan', 'urs-baku', 'urs-moskau-schwarz-weiss', 'urs-moskau-rot-blau', 'urs-odessa', 'urs-krasnodar', 'urs-alma-ata', 'urs-minsk', 'urs-taschkent', 'urs-lwiw', 'urs-rostow-rot-blau', 'urs-woroschilowgrad'],
    cup: 'urs-tiflis',
    cupFinalist: 'urs-moskau-blau',
    euro: { ec: ['urs-tiflis'], cwc: ['urs-donezk'], uefa: ['urs-kiew', 'urs-moskau-blau'] },
    note: "Erweiterung auf 18 Vereine.",
  },
  1980: {
    t1: ['urs-kiew', 'urs-moskau-rot-weiss', 'urs-leningrad', 'urs-tiflis', 'urs-donezk', 'urs-minsk', 'urs-moskau-blau', 'urs-moskau-schwarz-weiss', 'urs-baku', 'urs-krasnodar', 'urs-alma-ata', 'urs-moskau-rot-blau', 'urs-jerewan', 'urs-rostow-rot-blau', 'urs-odessa', 'urs-taschkent', 'urs-kuibyschew', 'urs-lwiw'],
    cup: 'urs-donezk',
    cupFinalist: 'urs-tiflis',
    euro: { ec: ['urs-moskau-rot-weiss'], cwc: ['urs-tiflis'], uefa: ['urs-kiew', 'urs-donezk'] },
  },
  1981: {
    t1: ['urs-kiew', 'urs-moskau-rot-weiss', 'urs-tiflis', 'urs-moskau-schwarz-weiss', 'urs-minsk', 'urs-donezk', 'urs-moskau-blau', 'urs-baku', 'urs-leningrad', 'urs-krasnodar', 'urs-alma-ata', 'urs-moskau-rot-blau', 'urs-odessa', 'urs-jerewan', 'urs-taschkent', 'urs-rostow-rot-blau', 'urs-dnipropetrowsk', 'urs-simferopol'],
    cup: 'urs-rostow-rot-blau',
    cupFinalist: 'urs-moskau-rot-weiss',
    euro: { ec: ['urs-kiew'], cwc: ['urs-rostow-rot-blau'], uefa: ['urs-moskau-rot-weiss', 'urs-minsk', 'urs-tiflis'] },
  },
  1982: {
    t1: ['urs-minsk', 'urs-kiew', 'urs-moskau-rot-weiss', 'urs-tiflis', 'urs-jerewan', 'urs-moskau-blau', 'urs-leningrad', 'urs-donezk', 'urs-odessa', 'urs-dnipropetrowsk', 'urs-taschkent', 'urs-moskau-schwarz-weiss', 'urs-baku', 'urs-charkiw', 'urs-moskau-rot-blau', 'urs-alma-ata', 'urs-krasnodar', 'urs-rostow-rot-blau'],
    cup: 'urs-kiew',
    cupFinalist: 'urs-moskau-schwarz-weiss',
    euro: { ec: ['urs-kiew'], cwc: ['urs-kiew'], uefa: ['urs-moskau-rot-weiss', 'urs-tiflis', 'urs-minsk'] },
    note: "Pokalsieger zugleich im Landesmeister-Wettbewerb – Eintrag vereinfacht.",
  },
  1983: {
    t1: ['urs-dnipropetrowsk', 'urs-moskau-rot-weiss', 'urs-minsk', 'urs-donezk', 'urs-leningrad', 'urs-odessa', 'urs-tiflis', 'urs-kiew', 'urs-moskau-schwarz-weiss', 'urs-jerewan', 'urs-moskau-blau', 'urs-taschkent', 'urs-charkiw', 'urs-baku', 'urs-moskau-rot-blau', 'urs-alma-ata', 'urs-woroschilowgrad', 'urs-nikolajew'],
    cup: 'urs-donezk',
    cupFinalist: 'urs-charkiw',
    euro: { ec: ['urs-minsk'], cwc: ['urs-donezk'], uefa: ['urs-moskau-rot-weiss', 'urs-dnipropetrowsk'] },
  },
  1984: {
    t1: ['urs-leningrad', 'urs-moskau-rot-weiss', 'urs-dnipropetrowsk', 'urs-minsk', 'urs-donezk', 'urs-moskau-schwarz-weiss', 'urs-tiflis', 'urs-moskau-blau', 'urs-odessa', 'urs-kiew', 'urs-charkiw', 'urs-jerewan', 'urs-taschkent', 'urs-alma-ata', 'urs-baku', 'urs-moskau-rot-blau', 'urs-kuibyschew', 'urs-woroschilowgrad'],
    cup: 'urs-moskau-blau',
    cupFinalist: 'urs-leningrad',
    euro: { ec: ['urs-dnipropetrowsk'], cwc: ['urs-moskau-blau'], uefa: ['urs-moskau-rot-weiss', 'urs-odessa'] },
  },
  1985: {
    t1: ['urs-kiew', 'urs-moskau-rot-weiss', 'urs-dnipropetrowsk', 'urs-minsk', 'urs-donezk', 'urs-moskau-schwarz-weiss', 'urs-leningrad', 'urs-tiflis', 'urs-odessa', 'urs-moskau-blau', 'urs-charkiw', 'urs-jerewan', 'urs-alma-ata', 'urs-baku', 'urs-kuibyschew', 'urs-moskau-rot-blau', 'urs-woronesch', 'urs-kutaissi'],
    cup: 'urs-kiew',
    cupFinalist: 'urs-moskau-blau',
    euro: { ec: ['urs-leningrad'], cwc: ['urs-kiew'], uefa: ['urs-moskau-rot-weiss', 'urs-dnipropetrowsk', 'urs-odessa'] },
  },
  1986: {
    t1: ['urs-kiew', 'urs-moskau-blau', 'urs-moskau-rot-weiss', 'urs-moskau-schwarz-weiss', 'urs-minsk', 'urs-dnipropetrowsk', 'urs-tiflis', 'urs-leningrad', 'urs-charkiw', 'urs-alma-ata', 'urs-odessa', 'urs-jerewan', 'urs-donezk', 'urs-moskau-rot-gruen', 'urs-baku', 'urs-kuibyschew'],
    cup: 'urs-moskau-schwarz-weiss',
    cupFinalist: 'urs-donezk',
    euro: { ec: ['urs-kiew'], cwc: ['urs-moskau-schwarz-weiss'], uefa: ['urs-moskau-rot-weiss', 'urs-dnipropetrowsk'] },
    note: "Verkleinerung auf 16 Vereine.",
  },
  1987: {
    t1: ['urs-moskau-rot-weiss', 'urs-dnipropetrowsk', 'urs-wilna', 'urs-kiew', 'urs-moskau-schwarz-weiss', 'urs-tiflis', 'urs-minsk', 'urs-charkiw', 'urs-moskau-blau', 'urs-donezk', 'urs-leningrad', 'urs-alma-ata', 'urs-moskau-rot-gruen', 'urs-jerewan', 'urs-baku', 'urs-lantschchuti'],
    cup: 'urs-kiew',
    cupFinalist: 'urs-moskau-blau',
    euro: { ec: ['urs-kiew'], cwc: ['urs-moskau-blau'], uefa: ['urs-moskau-rot-weiss', 'urs-wilna', 'urs-dnipropetrowsk'] },
  },
  1988: {
    t1: ['urs-dnipropetrowsk', 'urs-kiew', 'urs-moskau-schwarz-weiss', 'urs-moskau-rot-weiss', 'urs-wilna', 'urs-minsk', 'urs-moskau-blau', 'urs-tiflis', 'urs-charkiw', 'urs-donezk', 'urs-leningrad', 'urs-alma-ata', 'urs-moskau-rot-gruen', 'urs-odessa', 'urs-lantschchuti', 'urs-jerewan'],
    cup: 'urs-charkiw',
    cupFinalist: 'urs-moskau-schwarz-weiss',
    euro: { ec: ['urs-moskau-rot-weiss'], cwc: ['urs-charkiw'], uefa: ['urs-dnipropetrowsk', 'urs-moskau-schwarz-weiss', 'urs-kiew'] },
  },
  1989: {
    t1: ['urs-moskau-rot-weiss', 'urs-dnipropetrowsk', 'urs-kiew', 'urs-wilna', 'urs-moskau-blau', 'urs-moskau-schwarz-weiss', 'urs-minsk', 'urs-tiflis', 'urs-moskau-rot-gruen', 'urs-charkiw', 'urs-donezk', 'urs-odessa', 'urs-wolgograd', 'urs-duschanbe', 'urs-leningrad', 'urs-alma-ata'],
    cup: 'urs-dnipropetrowsk',
    cupFinalist: 'urs-moskau-schwarz-weiss',
    euro: { ec: ['urs-dnipropetrowsk'], cwc: ['urs-moskau-blau'], uefa: ['urs-kiew', 'urs-wilna', 'urs-moskau-schwarz-weiss'] },
  },
  1990: {
    t1: ['urs-kiew', 'urs-moskau-rot-blau', 'urs-moskau-blau', 'urs-moskau-schwarz-weiss', 'urs-moskau-rot-weiss', 'urs-odessa', 'urs-dnipropetrowsk', 'urs-minsk', 'urs-moskau-rot-gruen', 'urs-charkiw', 'urs-donezk', 'urs-wolgograd', 'urs-duschanbe'],
    cup: 'urs-kiew',
    cupFinalist: 'urs-moskau-rot-gruen',
    euro: { ec: ['urs-moskau-rot-weiss'], cwc: ['urs-kiew'], uefa: ['urs-moskau-schwarz-weiss', 'urs-dnipropetrowsk', 'urs-odessa'] },
    note: "Nur 13 Vereine: Wilna und die georgischen Vereine traten aus der sowjetischen Liga aus.",
  },
  1991: {
    t1: ['urs-moskau-rot-blau', 'urs-moskau-rot-weiss', 'urs-moskau-schwarz-weiss', 'urs-kiew', 'urs-moskau-blau', 'urs-odessa', 'urs-dnipropetrowsk', 'urs-minsk', 'urs-ordschonikidse', 'urs-donezk', 'urs-charkiw', 'urs-duschanbe', 'urs-wolgograd', 'urs-saporischschja', 'urs-jerewan', 'urs-taschkent'],
    cup: 'urs-moskau-rot-blau',
    cupFinalist: 'urs-moskau-schwarz-weiss',
    euro: { ec: ['urs-kiew'], cwc: ['urs-moskau-rot-blau'], uefa: ['urs-moskau-rot-weiss', 'urs-moskau-schwarz-weiss', 'urs-moskau-blau'] },
    note: "Letzte Meisterschaft der UdSSR. Plätze 4–16 unsicher.",
  },
};
