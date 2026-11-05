// =============================================================================
// Weltdaten cyp: First Division je Saison (Schlüssel = Startjahr, 1975 = 1975/76).
// t1 in Reihenfolge der Abschlusstabelle; cup/cupFinalist = Landespokal; euro = Europapokal-Teilnehmer.
// Quellen und Unsicherheiten: docs/recherche/weltvereine_cyp.md.
// =============================================================================
import type { SeasonRow } from '../types';

export const SEASONS_CYP: Record<number, SeasonRow> = {
  1975: {
    t1: ['cyp-nikosia-gruen', 'cyp-paralimni', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-rot-weiss', 'cyp-larnaka-rot-blau', 'cyp-larnaka-gruen', 'cyp-famagusta-blau', 'cyp-nikosia-schwarz-gruen', 'cyp-famagusta-rot', 'cyp-limassol-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot', 'cyp-morfou'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { ec: ['cyp-nikosia-gruen'], uefa: ['cyp-paralimni'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1976: {
    t1: ['cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-rot-weiss', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-larnaka-gruen', 'cyp-famagusta-blau', 'cyp-nikosia-schwarz-gruen', 'cyp-famagusta-rot', 'cyp-limassol-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot', 'cyp-morfou'],
    cup: 'cyp-nikosia-schwarz-gruen',
    euro: { ec: ['cyp-nikosia-gruen'], cwc: ['cyp-nikosia-gelb-blau'], uefa: ['cyp-paralimni'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1977: {
    t1: ['cyp-nikosia-gruen', 'cyp-larnaka-rot-weiss', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-larnaka-gruen', 'cyp-famagusta-blau', 'cyp-nikosia-schwarz-gruen', 'cyp-famagusta-rot', 'cyp-limassol-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot', 'cyp-morfou'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { ec: ['cyp-nikosia-gruen'], cwc: ['cyp-nikosia-schwarz-gruen'], uefa: ['cyp-nikosia-gelb-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1978: {
    t1: ['cyp-nikosia-gruen', 'cyp-larnaka-rot-blau', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-rot-weiss', 'cyp-paralimni', 'cyp-larnaka-gruen', 'cyp-famagusta-blau', 'cyp-nikosia-schwarz-gruen', 'cyp-famagusta-rot', 'cyp-limassol-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot', 'cyp-morfou'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { ec: ['cyp-nikosia-gruen'], cwc: ['cyp-nikosia-gelb-blau'], uefa: ['cyp-larnaka-rot-weiss'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1979: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-larnaka-rot-weiss', 'cyp-nikosia-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-larnaka-gruen', 'cyp-famagusta-blau', 'cyp-nikosia-schwarz-gruen', 'cyp-famagusta-rot', 'cyp-limassol-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot', 'cyp-morfou'],
    cup: 'cyp-nikosia-gruen',
    euro: { ec: ['cyp-nikosia-gruen'], cwc: ['cyp-nikosia-gelb-blau'], uefa: ['cyp-larnaka-rot-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1980: {
    t1: ['cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-rot-weiss', 'cyp-famagusta-blau', 'cyp-limassol-blau-weiss', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-limassol-gruen-weiss', 'cyp-achna', 'cyp-paphos-gelb'],
    cup: 'cyp-nikosia-gruen',
    euro: { ec: ['cyp-nikosia-gelb-blau'], cwc: ['cyp-nikosia-gruen'], uefa: ['cyp-larnaka-rot-weiss'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1981: {
    t1: ['cyp-nikosia-gruen', 'cyp-larnaka-rot-weiss', 'cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-limassol-blau-weiss', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-limassol-gruen-weiss', 'cyp-achna', 'cyp-paphos-gelb'],
    cup: 'cyp-nikosia-gruen',
    euro: { ec: ['cyp-nikosia-gruen'], uefa: ['cyp-nikosia-gelb-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1982: {
    t1: ['cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-rot-weiss', 'cyp-limassol-blau-weiss', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-limassol-gruen-weiss', 'cyp-achna', 'cyp-paphos-gelb'],
    cup: 'cyp-nikosia-gruen',
    euro: { ec: ['cyp-nikosia-gruen'], uefa: ['cyp-larnaka-rot-weiss'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1983: {
    t1: ['cyp-nikosia-gruen', 'cyp-limassol-blau-weiss', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-rot-weiss', 'cyp-famagusta-blau', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-limassol-gruen-weiss', 'cyp-achna', 'cyp-paphos-gelb'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { ec: ['cyp-nikosia-gruen'], uefa: ['cyp-famagusta-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1984: {
    t1: ['cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-rot-weiss', 'cyp-famagusta-blau', 'cyp-limassol-blau-weiss', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-limassol-gruen-weiss', 'cyp-achna', 'cyp-paphos-gelb'],
    cup: 'cyp-limassol-gelb-blau',
    euro: { ec: ['cyp-nikosia-gruen'], cwc: ['cyp-nikosia-gelb-blau'], uefa: ['cyp-limassol-blau-weiss'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1985: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-nikosia-gruen', 'cyp-larnaka-rot-weiss', 'cyp-famagusta-blau', 'cyp-limassol-blau-weiss', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-limassol-gruen-weiss', 'cyp-achna', 'cyp-paphos-gelb'],
    cup: 'cyp-limassol-blau-weiss',
    euro: { ec: ['cyp-nikosia-gruen'], cwc: ['cyp-limassol-gelb-blau'], uefa: ['cyp-nikosia-gelb-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1986: {
    t1: ['cyp-nikosia-gruen', 'cyp-larnaka-gruen', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-rot-weiss', 'cyp-famagusta-blau', 'cyp-limassol-blau-weiss', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-limassol-gruen-weiss', 'cyp-achna', 'cyp-paphos-gelb'],
    cup: 'cyp-limassol-gelb-blau',
    euro: { ec: ['cyp-nikosia-gelb-blau'], cwc: ['cyp-limassol-blau-weiss'], uefa: ['cyp-nikosia-gruen'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1987: {
    t1: ['cyp-larnaka-rot-weiss', 'cyp-nikosia-gelb-blau', 'cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-limassol-blau-weiss', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-limassol-gruen-weiss', 'cyp-achna', 'cyp-paphos-gelb'],
    cup: 'cyp-nikosia-gruen',
    euro: { ec: ['cyp-nikosia-gruen'], cwc: ['cyp-limassol-gelb-blau'], uefa: ['cyp-larnaka-gruen'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1988: {
    t1: ['cyp-nikosia-gruen', 'cyp-limassol-blau-weiss', 'cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-larnaka-rot-weiss', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-achna', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot'],
    cup: 'cyp-limassol-gelb-blau',
    euro: { ec: ['cyp-larnaka-rot-weiss'], cwc: ['cyp-nikosia-gruen'], uefa: ['cyp-nikosia-gelb-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1989: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-nikosia-gruen', 'cyp-limassol-blau-weiss', 'cyp-famagusta-blau', 'cyp-larnaka-rot-weiss', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-achna', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot'],
    cup: 'cyp-famagusta-rot',
    euro: { ec: ['cyp-nikosia-gruen'], cwc: ['cyp-limassol-gelb-blau'], uefa: ['cyp-limassol-blau-weiss'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1990: {
    t1: ['cyp-limassol-blau-weiss', 'cyp-famagusta-blau', 'cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-rot-weiss', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-achna', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot'],
    cup: 'cyp-nikosia-gruen',
    euro: { ec: ['cyp-nikosia-gelb-blau'], cwc: ['cyp-famagusta-rot'], uefa: ['cyp-nikosia-gruen'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1991: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-nikosia-gruen', 'cyp-limassol-blau-weiss', 'cyp-larnaka-rot-weiss', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-achna', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot'],
    cup: 'cyp-limassol-blau-weiss',
    euro: { ec: ['cyp-limassol-blau-weiss'], cwc: ['cyp-nikosia-gruen'], uefa: ['cyp-famagusta-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1992: {
    t1: ['cyp-nikosia-gruen', 'cyp-limassol-blau-weiss', 'cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-larnaka-rot-weiss', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-achna', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { cwc: ['cyp-limassol-blau-weiss'], uefa: ['cyp-famagusta-blau'], cl: ['cyp-nikosia-gelb-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1993: {
    t1: ['cyp-limassol-blau-weiss', 'cyp-famagusta-blau', 'cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-rot-weiss', 'cyp-larnaka-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-paralimni', 'cyp-achna', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot'],
    cup: 'cyp-nikosia-gruen',
    euro: { cwc: ['cyp-nikosia-gelb-blau'], uefa: ['cyp-limassol-blau-weiss'], cl: ['cyp-nikosia-gruen'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1994: {
    t1: ['cyp-famagusta-blau', 'cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-achna', 'cyp-paralimni', 'cyp-larnaka-rot-blau', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot', 'cyp-paphos-gelb'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { cwc: ['cyp-nikosia-gruen'], uefa: ['cyp-famagusta-blau', 'cyp-limassol-blau-weiss'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1995: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-nikosia-gruen', 'cyp-limassol-blau-weiss', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-achna', 'cyp-paralimni', 'cyp-larnaka-rot-blau', 'cyp-limassol-gruen-weiss', 'cyp-paphos-rot', 'cyp-paphos-gelb'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { cwc: ['cyp-nikosia-gelb-blau'], uefa: ['cyp-nikosia-gruen'], cl: ['cyp-famagusta-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (nur Meister und Zweiter gegen die Europapokal-Teilnahmen geprüft)',
  },
  1996: {
    t1: ['cyp-famagusta-blau', 'cyp-limassol-blau-weiss', 'cyp-nikosia-gruen', 'cyp-larnaka-gelb-gruen', 'cyp-nikosia-gelb-blau', 'cyp-achna', 'cyp-paralimni', 'cyp-famagusta-rot', 'cyp-deryneia', 'cyp-paphos-gelb', 'cyp-larnaka-rot-blau', 'cyp-limassol-gruen-weiss', 'cyp-nikosia-schwarz-gruen', 'cyp-kyperounta'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { uefa: ['cyp-famagusta-blau', 'cyp-nikosia-gelb-blau'] },
  },
  1997: {
    t1: ['cyp-famagusta-blau', 'cyp-nikosia-gruen', 'cyp-limassol-blau-weiss', 'cyp-achna', 'cyp-larnaka-gelb-gruen', 'cyp-paralimni', 'cyp-nikosia-gelb-blau', 'cyp-famagusta-rot', 'cyp-paphos-rot', 'cyp-larnaka-rot-blau', 'cyp-limassol-gelb-blau', 'cyp-deryneia', 'cyp-paphos-gelb', 'cyp-assia'],
    cup: 'cyp-famagusta-blau',
    euro: { cwc: ['cyp-nikosia-gelb-blau'], uefa: ['cyp-famagusta-blau', 'cyp-limassol-blau-weiss'], cl: ['cyp-famagusta-blau'] },
  },
  1998: {
    t1: ['cyp-famagusta-blau', 'cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-gelb-blau', 'cyp-achna', 'cyp-limassol-blau-weiss', 'cyp-paralimni', 'cyp-nikosia-schwarz-gruen', 'cyp-famagusta-rot', 'cyp-larnaka-rot-blau', 'cyp-paphos-rot', 'cyp-katokopia', 'cyp-limassol-gruen-weiss'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { uefa: ['cyp-famagusta-blau', 'cyp-nikosia-gruen'], cl: ['cyp-famagusta-blau'] },
  },
  1999: {
    t1: ['cyp-famagusta-blau', 'cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau', 'cyp-famagusta-rot', 'cyp-limassol-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-larnaka-gelb-gruen', 'cyp-paralimni', 'cyp-nikosia-schwarz-gruen', 'cyp-achna', 'cyp-paphos-gelb', 'cyp-assia', 'cyp-deryneia', 'cyp-larnaka-rot-blau'],
    cup: 'cyp-nikosia-gruen',
    euro: { uefa: ['cyp-famagusta-blau', 'cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau'], cl: ['cyp-famagusta-blau'] },
  },
  2000: {
    t1: ['cyp-nikosia-gruen', 'cyp-nikosia-schwarz-gruen', 'cyp-limassol-gelb-blau', 'cyp-famagusta-blau', 'cyp-limassol-blau-weiss', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-paphos', 'cyp-paralimni', 'cyp-katokopia', 'cyp-achna', 'cyp-famagusta-rot', 'cyp-morfou', 'cyp-limassol-gruen-weiss'],
    cup: 'cyp-limassol-blau-weiss',
    euro: { uefa: ['cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau'], cl: ['cyp-famagusta-blau'] },
  },
  2001: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-limassol-gelb-blau', 'cyp-nikosia-gruen', 'cyp-achna', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-gelb-gruen', 'cyp-paralimni', 'cyp-paphos', 'cyp-limassol-blau-weiss', 'cyp-larnaka-rot-blau', 'cyp-assia', 'cyp-katokopia', 'cyp-aradippou'],
    cup: 'cyp-famagusta-blau',
    euro: { uefa: ['cyp-nikosia-schwarz-gruen', 'cyp-limassol-blau-weiss'], cl: ['cyp-nikosia-gruen'] },
  },
  2002: {
    t1: ['cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-nikosia-gelb-blau', 'cyp-nikosia-schwarz-gruen', 'cyp-limassol-gelb-blau', 'cyp-paphos', 'cyp-achna', 'cyp-larnaka-gelb-gruen', 'cyp-morfou', 'cyp-limassol-blau-weiss', 'cyp-paralimni', 'cyp-famagusta-rot', 'cyp-limassol-gruen-weiss', 'cyp-larnaka-rot-blau'],
    cup: 'cyp-famagusta-blau',
    euro: { uefa: ['cyp-famagusta-blau', 'cyp-nikosia-gelb-blau', 'cyp-limassol-gelb-blau'], cl: ['cyp-nikosia-gelb-blau'] },
  },
  2003: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-nikosia-gruen', 'cyp-limassol-blau-weiss', 'cyp-limassol-gelb-blau', 'cyp-famagusta-blau', 'cyp-achna', 'cyp-paphos', 'cyp-paralimni', 'cyp-larnaka-gelb-gruen', 'cyp-nikosia-schwarz-gruen', 'cyp-morfou', 'cyp-deryneia', 'cyp-sotira', 'cyp-katokopia'],
    cup: 'cyp-larnaka-gelb-gruen',
    euro: { uefa: ['cyp-nikosia-gelb-blau', 'cyp-famagusta-blau'], cl: ['cyp-nikosia-gruen'] },
  },
  2004: {
    t1: ['cyp-famagusta-blau', 'cyp-nikosia-gelb-blau', 'cyp-nikosia-gruen', 'cyp-nikosia-schwarz-gruen', 'cyp-morfou', 'cyp-famagusta-rot', 'cyp-limassol-blau-weiss', 'cyp-paralimni', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-gelb-blau', 'cyp-achna', 'cyp-larnaka-rot-blau', 'cyp-paphos', 'cyp-limassol-gruen-weiss'],
    cup: 'cyp-nikosia-gruen',
    euro: { uefa: ['cyp-nikosia-gruen', 'cyp-larnaka-gelb-gruen'], cl: ['cyp-nikosia-gelb-blau'] },
  },
  2005: {
    t1: ['cyp-limassol-blau-weiss', 'cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-paralimni', 'cyp-famagusta-rot', 'cyp-limassol-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-achna', 'cyp-morfou', 'cyp-nikosia-schwarz-gruen', 'cyp-peyia', 'cyp-kyperounta', 'cyp-lakatamia'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { uefa: ['cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau', 'cyp-famagusta-blau'], cl: ['cyp-famagusta-blau'] },
  },
  2006: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-achna', 'cyp-paralimni', 'cyp-limassol-blau-weiss', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-gruen-weiss', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-morfou', 'cyp-ayia-napa', 'cyp-paphos'],
    cup: 'cyp-famagusta-blau',
    euro: { uefa: ['cyp-nikosia-gelb-blau', 'cyp-nikosia-gruen', 'cyp-achna'], cl: ['cyp-limassol-blau-weiss'] },
  },
  2007: {
    t1: ['cyp-famagusta-blau', 'cyp-nikosia-gelb-blau', 'cyp-nikosia-gruen', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss', 'cyp-paralimni', 'cyp-achna', 'cyp-peyia', 'cyp-larnaka-rot-blau', 'cyp-limassol-gelb-blau', 'cyp-katokopia', 'cyp-limassol-gruen-weiss', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { uefa: ['cyp-famagusta-blau', 'cyp-nikosia-gruen'], cl: ['cyp-nikosia-gelb-blau'] },
  },
  2008: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-limassol-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-achna', 'cyp-peyia', 'cyp-katokopia', 'cyp-paphos', 'cyp-paralimni', 'cyp-kyperounta', 'cyp-larnaka-rot-blau', 'cyp-larnaka-gelb-gruen', 'cyp-geroskipou'],
    cup: 'cyp-peyia',
    euro: { uefa: ['cyp-nikosia-gelb-blau', 'cyp-nikosia-gruen'], cl: ['cyp-famagusta-blau'] },
  },
  2009: {
    t1: ['cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-limassol-blau-weiss', 'cyp-limassol-gelb-blau', 'cyp-paralimni', 'cyp-achna', 'cyp-peyia', 'cyp-aradippou', 'cyp-paphos', 'cyp-katokopia', 'cyp-limassol-gruen-weiss', 'cyp-kyperounta', 'cyp-famagusta-rot'],
    cup: 'cyp-limassol-blau-weiss',
    euro: { cl: ['cyp-nikosia-gelb-blau'], el: ['cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-peyia'] },
  },
  2010: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss', 'cyp-paralimni', 'cyp-limassol-gelb-blau', 'cyp-nikosia-schwarz-gruen', 'cyp-larnaka-rot-blau', 'cyp-achna', 'cyp-aradippou', 'cyp-paphos', 'cyp-katokopia', 'cyp-peyia'],
    cup: 'cyp-nikosia-gruen',
    euro: { cl: ['cyp-nikosia-gruen'], el: ['cyp-nikosia-gelb-blau', 'cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-limassol-blau-weiss'] },
  },
  2011: {
    t1: ['cyp-limassol-gelb-blau', 'cyp-nikosia-gruen', 'cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss', 'cyp-famagusta-rot', 'cyp-larnaka-rot-blau', 'cyp-achna', 'cyp-nikosia-schwarz-gruen', 'cyp-paralimni', 'cyp-limassol-gruen-weiss', 'cyp-deryneia', 'cyp-aradippou'],
    cup: 'cyp-nikosia-gruen',
    euro: { cl: ['cyp-nikosia-gelb-blau'], el: ['cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-larnaka-gelb-gruen'] },
  },
  2012: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-nikosia-gruen', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-katokopia', 'cyp-paralimni', 'cyp-nikosia-schwarz-gruen', 'cyp-achna', 'cyp-larnaka-rot-blau', 'cyp-famagusta-rot', 'cyp-paphos', 'cyp-ayia-napa'],
    cup: 'cyp-limassol-blau-weiss',
    euro: { cl: ['cyp-limassol-gelb-blau'], el: ['cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-nikosia-gruen', 'cyp-limassol-gelb-blau'] },
  },
  2013: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-limassol-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-aradippou', 'cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-famagusta-rot', 'cyp-larnaka-gelb-gruen', 'cyp-achna', 'cyp-katokopia', 'cyp-kouklia', 'cyp-paralimni', 'cyp-limassol-gruen-weiss', 'cyp-larnaka-rot-blau'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { cl: ['cyp-nikosia-gelb-blau'], el: ['cyp-nikosia-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-nikosia-gruen', 'cyp-famagusta-blau'] },
  },
  2014: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss', 'cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-aradippou', 'cyp-achna', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-ayia-napa', 'cyp-katokopia', 'cyp-athienou'],
    cup: 'cyp-nikosia-gelb-blau',
    euro: { cl: ['cyp-nikosia-gelb-blau', 'cyp-limassol-gelb-blau'], el: ['cyp-limassol-blau-weiss', 'cyp-nikosia-gruen', 'cyp-aradippou', 'cyp-limassol-gelb-blau'] },
  },
  2015: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss', 'cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-famagusta-rot', 'cyp-limassol-gelb-blau', 'cyp-aradippou', 'cyp-limassol-gruen-weiss', 'cyp-katokopia', 'cyp-achna', 'cyp-paphos-blau-weiss', 'cyp-paralimni', 'cyp-ayia-napa'],
    cup: 'cyp-limassol-blau-weiss',
    euro: { cl: ['cyp-nikosia-gelb-blau'], el: ['cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss', 'cyp-nikosia-gruen'] },
  },
  2016: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss', 'cyp-limassol-gelb-blau', 'cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-aradippou', 'cyp-famagusta-rot', 'cyp-achna', 'cyp-limassol-gruen-weiss', 'cyp-katokopia', 'cyp-pano-polemidia', 'cyp-zakaki', 'cyp-deryneia'],
    cup: 'cyp-limassol-blau-weiss',
    euro: { cl: ['cyp-nikosia-gelb-blau'], el: ['cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss', 'cyp-nikosia-gruen'] },
  },
  2017: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-famagusta-blau', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-gelb-blau', 'cyp-nikosia-gruen', 'cyp-famagusta-rot', 'cyp-aradippou', 'cyp-katokopia', 'cyp-paphos-blau-weiss', 'cyp-oroklini', 'cyp-nikosia-schwarz-gruen', 'cyp-limassol-gruen-weiss', 'cyp-achna'],
    cup: 'cyp-larnaka-gelb-gruen',
    euro: { cl: ['cyp-nikosia-gelb-blau'], el: ['cyp-limassol-blau-weiss', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-gelb-blau'] },
  },
  2018: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss', 'cyp-limassol-gelb-blau', 'cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-paphos-blau-weiss', 'cyp-paralimni', 'cyp-oroklini', 'cyp-katokopia', 'cyp-famagusta-rot', 'cyp-aradippou'],
    cup: 'cyp-limassol-gelb-blau',
    euro: { cl: ['cyp-nikosia-gelb-blau'], el: ['cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss', 'cyp-famagusta-blau'] },
  },
  2019: {
    t1: ['cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-nikosia-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-gelb-blau', 'cyp-paphos-blau-weiss', 'cyp-famagusta-rot', 'cyp-nikosia-schwarz-gruen', 'cyp-paralimni', 'cyp-achna', 'cyp-katokopia'],
    euro: { cl: ['cyp-nikosia-gelb-blau'], el: ['cyp-nikosia-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-gelb-blau'] },
    note: 'Saison wegen der Pandemie abgebrochen, kein Meister; Stand beim Abbruch',
  },
  2020: {
    t1: ['cyp-nikosia-gruen', 'cyp-limassol-blau-weiss', 'cyp-limassol-gelb-blau', 'cyp-famagusta-blau', 'cyp-larnaka-gelb-gruen', 'cyp-nikosia-schwarz-gruen', 'cyp-paphos-blau-weiss', 'cyp-nikosia-gelb-blau', 'cyp-achna', 'cyp-katokopia', 'cyp-famagusta-rot', 'cyp-aradippou', 'cyp-paralimni', 'cyp-pano-polemidia'],
    cup: 'cyp-famagusta-blau',
    euro: { cl: ['cyp-nikosia-gruen'], el: ['cyp-nikosia-gruen', 'cyp-limassol-blau-weiss', 'cyp-famagusta-blau', 'cyp-nikosia-gelb-blau'] },
  },
  2021: {
    t1: ['cyp-limassol-blau-weiss', 'cyp-larnaka-gelb-gruen', 'cyp-nikosia-gelb-blau', 'cyp-limassol-gruen-weiss', 'cyp-famagusta-blau', 'cyp-paphos-blau-weiss', 'cyp-nikosia-gruen', 'cyp-limassol-gelb-blau', 'cyp-nikosia-schwarz-gruen', 'cyp-katokopia', 'cyp-achna', 'cyp-keryneia'],
    cup: 'cyp-nikosia-gruen',
    euro: { cl: ['cyp-nikosia-gruen'], el: ['cyp-famagusta-blau', 'cyp-nikosia-gruen'], ecl: ['cyp-limassol-blau-weiss', 'cyp-famagusta-blau', 'cyp-nikosia-gruen', 'cyp-limassol-gelb-blau'] },
  },
  2022: {
    t1: ['cyp-limassol-gruen-weiss', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-paphos-blau-weiss', 'cyp-limassol-blau-weiss', 'cyp-nikosia-gruen', 'cyp-famagusta-blau', 'cyp-famagusta-rot', 'cyp-limassol-gelb-blau', 'cyp-pano-polemidia', 'cyp-katokopia', 'cyp-paralimni', 'cyp-chloraka', 'cyp-nikosia-schwarz-gruen'],
    cup: 'cyp-nikosia-gruen',
    euro: { cl: ['cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss'], el: ['cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss', 'cyp-nikosia-gruen'], ecl: ['cyp-limassol-gruen-weiss', 'cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-limassol-blau-weiss'] },
  },
  2023: {
    t1: ['cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-nikosia-gruen', 'cyp-limassol-gruen-weiss', 'cyp-paphos-blau-weiss', 'cyp-famagusta-blau', 'cyp-limassol-blau-weiss', 'cyp-limassol-gelb-blau', 'cyp-famagusta-rot', 'cyp-achna', 'cyp-pano-polemidia', 'cyp-katokopia', 'cyp-athienou', 'cyp-zakaki'],
    cup: 'cyp-paphos-blau-weiss',
    euro: { cl: ['cyp-limassol-gruen-weiss'], el: ['cyp-limassol-gruen-weiss'], ecl: ['cyp-nikosia-gelb-blau', 'cyp-larnaka-gelb-gruen', 'cyp-nikosia-gruen'] },
  },
  2024: {
    t1: ['cyp-paphos-blau-weiss', 'cyp-limassol-gruen-weiss', 'cyp-nikosia-gruen', 'cyp-larnaka-gelb-gruen', 'cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-achna', 'cyp-limassol-gelb-blau', 'cyp-limassol-blau-weiss', 'cyp-pano-polemidia', 'cyp-paralimni', 'cyp-aradippou-gruen', 'cyp-famagusta-rot', 'cyp-nikosia-weiss-gruen'],
    cup: 'cyp-larnaka-gelb-gruen',
    euro: { cl: ['cyp-nikosia-gelb-blau'], el: ['cyp-paphos-blau-weiss', 'cyp-nikosia-gelb-blau'], ecl: ['cyp-paphos-blau-weiss', 'cyp-nikosia-gruen', 'cyp-larnaka-gelb-gruen', 'cyp-nikosia-gelb-blau'] },
  },
  2025: {
    t1: ['cyp-paphos-blau-weiss', 'cyp-limassol-gruen-weiss', 'cyp-nikosia-gruen', 'cyp-larnaka-gelb-gruen', 'cyp-nikosia-gelb-blau', 'cyp-famagusta-blau', 'cyp-limassol-blau-weiss', 'cyp-limassol-gelb-blau', 'cyp-achna', 'cyp-aradippou-gruen', 'cyp-paralimni', 'cyp-nikosia-schwarz-gruen', 'cyp-chloraka', 'cyp-ypsonas'],
    euro: { cl: ['cyp-paphos-blau-weiss'], el: ['cyp-larnaka-gelb-gruen'], ecl: ['cyp-limassol-gruen-weiss', 'cyp-nikosia-gruen'] },
    note: 'Laufende Saison: Zusammensetzung zu Saisonbeginn (Vorjahresplatz, Aufsteiger hinten) – Aufsteiger aus Wissen, ungeprüft',
  },
};
