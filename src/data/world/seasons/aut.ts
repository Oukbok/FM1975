// =============================================================================
// Weltdaten aut: Bundesliga (1. Division) je Saison (Schlüssel = Startjahr, 1975 = 1975/76).
// t1 in Reihenfolge der Abschlusstabelle; cup/cupFinalist = Landespokal; euro = Europapokal-Teilnehmer.
// Quellen und Unsicherheiten: docs/recherche/weltvereine_aut.md.
// =============================================================================
import type { SeasonRow } from '../types';

export const SEASONS_AUT: Record<number, SeasonRow> = {
  1975: {
    t1: ['aut-wien-violett', 'aut-innsbruck', 'aut-wien-gruen', 'aut-salzburg', 'aut-maria-enzersdorf', 'aut-linz-blau-weiss', 'aut-linz-schwarz-weiss', 'aut-graz-schwarz-weiss', 'aut-graz-rot', 'aut-klagenfurt'],
    cup: 'aut-wien-gruen', cupFinalist: 'aut-innsbruck',
    euro: { ec: ['aut-innsbruck'], cwc: ['aut-graz-schwarz-weiss'], uefa: ['aut-wien-gruen', 'aut-linz-blau-weiss'] },
  },
  1976: {
    t1: ['aut-innsbruck', 'aut-wien-gruen', 'aut-wien-violett', 'aut-linz-schwarz-weiss', 'aut-linz-blau-weiss', 'aut-maria-enzersdorf', 'aut-wien-blau-gelb', 'aut-graz-rot', 'aut-graz-schwarz-weiss', 'aut-salzburg'],
    cup: 'aut-wien-violett', cupFinalist: 'aut-innsbruck',
    euro: { ec: ['aut-wien-violett'], cwc: ['aut-wien-gruen'], uefa: ['aut-innsbruck', 'aut-salzburg'] },
  },
  1977: {
    t1: ['aut-wien-violett', 'aut-wien-gruen', 'aut-innsbruck', 'aut-graz-schwarz-weiss', 'aut-linz-blau-weiss', 'aut-graz-rot', 'aut-wien-blau-gelb', 'aut-wien-schwarz-weiss', 'aut-maria-enzersdorf', 'aut-linz-schwarz-weiss'],
    cup: 'aut-innsbruck', cupFinalist: 'aut-linz-blau-weiss',
    euro: { ec: ['aut-innsbruck'], cwc: ['aut-wien-violett'], uefa: ['aut-wien-gruen', 'aut-linz-schwarz-weiss'] },
  },
  1978: {
    t1: ['aut-wien-violett', 'aut-wien-schwarz-weiss', 'aut-wien-gruen', 'aut-graz-schwarz-weiss', 'aut-linz-blau-weiss', 'aut-salzburg', 'aut-maria-enzersdorf', 'aut-wien-blau-gelb', 'aut-graz-rot', 'aut-innsbruck'],
    cup: 'aut-innsbruck', cupFinalist: 'aut-maria-enzersdorf',
    euro: { ec: ['aut-wien-violett'], cwc: ['aut-innsbruck'], uefa: ['aut-wien-gruen', 'aut-graz-schwarz-weiss'] },
  },
  1979: {
    t1: ['aut-wien-violett', 'aut-linz-blau-weiss', 'aut-linz-schwarz-weiss', 'aut-graz-rot', 'aut-wien-gruen', 'aut-salzburg', 'aut-maria-enzersdorf', 'aut-wien-schwarz-weiss', 'aut-graz-schwarz-weiss', 'aut-wien-blau-gelb'],
    cup: 'aut-wien-violett', cupFinalist: 'aut-salzburg',
    euro: { ec: ['aut-wien-violett'], cwc: ['aut-innsbruck'], uefa: ['aut-wien-gruen', 'aut-wien-schwarz-weiss'] },
  },
  1980: {
    t1: ['aut-wien-violett', 'aut-graz-schwarz-weiss', 'aut-wien-gruen', 'aut-maria-enzersdorf', 'aut-graz-rot', 'aut-linz-blau-weiss', 'aut-linz-schwarz-weiss', 'aut-wien-schwarz-weiss', 'aut-salzburg', 'aut-eisenstadt'],
    cup: 'aut-graz-rot', cupFinalist: 'aut-salzburg',
    euro: { ec: ['aut-wien-violett'], cwc: ['aut-salzburg'], uefa: ['aut-linz-blau-weiss', 'aut-linz-schwarz-weiss'] },
  },
  1981: {
    t1: ['aut-wien-gruen', 'aut-wien-violett', 'aut-graz-rot', 'aut-maria-enzersdorf', 'aut-innsbruck', 'aut-graz-schwarz-weiss', 'aut-wien-schwarz-weiss', 'aut-linz-blau-weiss', 'aut-salzburg', 'aut-linz-schwarz-weiss'],
    cup: 'aut-wien-violett', cupFinalist: 'aut-innsbruck',
    euro: { ec: ['aut-wien-violett'], cwc: ['aut-graz-rot'], uefa: ['aut-wien-gruen', 'aut-graz-schwarz-weiss'] },
  },
  1982: {
    t1: ['aut-wien-gruen', 'aut-wien-violett', 'aut-innsbruck', 'aut-graz-schwarz-weiss', 'aut-salzburg', 'aut-klagenfurt', 'aut-graz-rot', 'aut-linz-blau-weiss', 'aut-eisenstadt', 'aut-maria-enzersdorf', 'aut-wien-schwarz-weiss', 'aut-linz-schwarz-weiss', 'aut-neusiedl', 'aut-wels', 'aut-wien-blau-gelb', 'aut-wien-simmering'],
    cup: 'aut-wien-gruen', cupFinalist: 'aut-innsbruck',
    euro: { ec: ['aut-wien-gruen'], cwc: ['aut-wien-violett'], uefa: ['aut-graz-rot', 'aut-maria-enzersdorf'] },
  },
  1983: {
    t1: ['aut-wien-violett', 'aut-wien-gruen', 'aut-linz-schwarz-weiss', 'aut-innsbruck', 'aut-graz-schwarz-weiss', 'aut-maria-enzersdorf', 'aut-klagenfurt', 'aut-graz-rot', 'aut-wien-schwarz-weiss', 'aut-salzburg', 'aut-eisenstadt', 'aut-linz-blau-weiss', 'aut-wien-favoriten', 'aut-st-veit', 'aut-wels', 'aut-neusiedl'],
    cup: 'aut-wien-gruen', cupFinalist: 'aut-wien-violett',
    euro: { ec: ['aut-wien-gruen'], cwc: ['aut-innsbruck'], uefa: ['aut-wien-violett', 'aut-graz-schwarz-weiss'] },
  },
  1984: {
    t1: ['aut-wien-violett', 'aut-wien-gruen', 'aut-linz-schwarz-weiss', 'aut-innsbruck', 'aut-maria-enzersdorf', 'aut-graz-schwarz-weiss', 'aut-klagenfurt', 'aut-eisenstadt', 'aut-linz-blau-weiss', 'aut-graz-rot', 'aut-leoben', 'aut-wien-schwarz-weiss', 'aut-spittal', 'aut-wien-favoriten', 'aut-salzburg', 'aut-wien-blau-gelb'],
    cup: 'aut-wien-gruen', cupFinalist: 'aut-wien-violett',
    euro: { ec: ['aut-wien-violett'], cwc: ['aut-wien-gruen'], uefa: ['aut-linz-schwarz-weiss', 'aut-innsbruck'] },
  },
  1985: {
    t1: ['aut-wien-violett', 'aut-wien-gruen', 'aut-innsbruck', 'aut-linz-schwarz-weiss', 'aut-graz-schwarz-weiss', 'aut-graz-rot', 'aut-maria-enzersdorf', 'aut-klagenfurt', 'aut-linz-blau-weiss', 'aut-eisenstadt', 'aut-leoben', 'aut-salzburg-nonntal'],
    cup: 'aut-wien-violett', cupFinalist: 'aut-wien-gruen',
    euro: { ec: ['aut-wien-violett'], cwc: ['aut-wien-gruen'], uefa: ['aut-innsbruck', 'aut-linz-schwarz-weiss'] },
  },
  1986: {
    t1: ['aut-wien-gruen', 'aut-wien-violett', 'aut-innsbruck', 'aut-linz-schwarz-weiss', 'aut-maria-enzersdorf', 'aut-wien-schwarz-weiss', 'aut-graz-schwarz-weiss', 'aut-linz-blau-weiss', 'aut-wien-blau-gelb', 'aut-eisenstadt', 'aut-graz-rot', 'aut-klagenfurt'],
    cup: 'aut-wien-gruen', cupFinalist: 'aut-innsbruck',
    euro: { ec: ['aut-wien-violett'], cwc: ['aut-wien-gruen'], uefa: ['aut-innsbruck', 'aut-linz-schwarz-weiss'] },
  },
  1987: {
    t1: ['aut-wien-gruen', 'aut-wien-violett', 'aut-graz-schwarz-weiss', 'aut-wien-blau-gelb', 'aut-maria-enzersdorf', 'aut-innsbruck', 'aut-graz-rot', 'aut-wien-schwarz-weiss', 'aut-linz-blau-weiss', 'aut-linz-schwarz-weiss', 'aut-klagenfurt', 'aut-moedling'],
    cup: 'aut-krems', cupFinalist: 'aut-innsbruck',
    euro: { ec: ['aut-wien-gruen'], cwc: ['aut-innsbruck'], uefa: ['aut-wien-violett', 'aut-maria-enzersdorf', 'aut-linz-schwarz-weiss'] },
  },
  1988: {
    t1: ['aut-innsbruck', 'aut-maria-enzersdorf', 'aut-wien-violett', 'aut-wien-gruen', 'aut-wien-blau-gelb', 'aut-wien-schwarz-weiss', 'aut-graz-rot', 'aut-st-poelten', 'aut-steyr', 'aut-klagenfurt', 'aut-graz-schwarz-weiss', 'aut-linz-schwarz-weiss'],
    cup: 'aut-innsbruck', cupFinalist: 'aut-maria-enzersdorf',
    euro: { ec: ['aut-wien-gruen'], cwc: ['aut-krems'], uefa: ['aut-wien-violett', 'aut-wien-blau-gelb', 'aut-graz-schwarz-weiss'] },
  },
  1989: {
    t1: ['aut-innsbruck', 'aut-wien-violett', 'aut-wien-gruen', 'aut-maria-enzersdorf', 'aut-graz-schwarz-weiss', 'aut-salzburg', 'aut-st-poelten', 'aut-wien-blau-gelb', 'aut-krems', 'aut-steyr', 'aut-wien-schwarz-weiss', 'aut-graz-rot'],
    cup: 'aut-wien-violett', cupFinalist: 'aut-wien-gruen',
    euro: { ec: ['aut-innsbruck'], cwc: ['aut-maria-enzersdorf'], uefa: ['aut-wien-violett', 'aut-wien-gruen', 'aut-wien-blau-gelb'] },
  },
  1990: {
    t1: ['aut-wien-violett', 'aut-innsbruck', 'aut-graz-schwarz-weiss', 'aut-wien-gruen', 'aut-salzburg', 'aut-maria-enzersdorf', 'aut-steyr', 'aut-leoben', 'aut-wien-schwarz-weiss', 'aut-wien-blau-gelb', 'aut-krems', 'aut-st-poelten'],
    cup: 'aut-stockerau', cupFinalist: 'aut-wien-gruen',
    euro: { ec: ['aut-innsbruck'], cwc: ['aut-wien-violett'], uefa: ['aut-wien-gruen', 'aut-maria-enzersdorf'] },
  },
  1991: {
    t1: ['aut-wien-violett', 'aut-salzburg', 'aut-innsbruck', 'aut-maria-enzersdorf', 'aut-wien-gruen', 'aut-linz-blau-weiss', 'aut-steyr', 'aut-st-poelten', 'aut-graz-schwarz-weiss', 'aut-krems', 'aut-wien-blau-gelb', 'aut-leoben'],
    cup: 'aut-wien-violett', cupFinalist: 'aut-maria-enzersdorf',
    euro: { ec: ['aut-wien-violett'], cwc: ['aut-stockerau'], uefa: ['aut-innsbruck', 'aut-graz-schwarz-weiss'] },
  },
  1992: {
    t1: ['aut-wien-violett', 'aut-salzburg', 'aut-maria-enzersdorf', 'aut-wien-gruen', 'aut-innsbruck', 'aut-st-poelten', 'aut-wien-schwarz-weiss', 'aut-steyr', 'aut-moedling', 'aut-linz-schwarz-weiss', 'aut-linz-blau-weiss', 'aut-graz-schwarz-weiss'],
    cup: 'aut-innsbruck', cupFinalist: 'aut-wien-gruen',
    euro: { cwc: ['aut-maria-enzersdorf'], uefa: ['aut-salzburg', 'aut-wien-gruen', 'aut-innsbruck'], cl: ['aut-wien-violett'] },
  },
  1993: {
    t1: ['aut-salzburg', 'aut-wien-violett', 'aut-maria-enzersdorf', 'aut-innsbruck', 'aut-wien-gruen', 'aut-moedling', 'aut-graz-schwarz-weiss', 'aut-steyr', 'aut-st-poelten', 'aut-wien-schwarz-weiss'],
    cup: 'aut-wien-violett', cupFinalist: 'aut-linz-blau-weiss',
    euro: { cwc: ['aut-innsbruck'], uefa: ['aut-salzburg', 'aut-maria-enzersdorf'], cl: ['aut-wien-violett'] },
  },
  1994: {
    t1: ['aut-salzburg', 'aut-graz-schwarz-weiss', 'aut-wien-gruen', 'aut-wien-violett', 'aut-innsbruck', 'aut-linz-schwarz-weiss', 'aut-maria-enzersdorf', 'aut-steyr', 'aut-linz-blau-weiss', 'aut-moedling'],
    cup: 'aut-wien-gruen', cupFinalist: 'aut-leoben',
    euro: { cwc: ['aut-wien-violett'], uefa: ['aut-innsbruck', 'aut-maria-enzersdorf'], cl: ['aut-salzburg'] },
  },
  1995: {
    t1: ['aut-wien-gruen', 'aut-graz-schwarz-weiss', 'aut-innsbruck', 'aut-graz-rot', 'aut-wien-violett', 'aut-linz-schwarz-weiss', 'aut-ried', 'aut-salzburg', 'aut-maria-enzersdorf', 'aut-steyr'],
    cup: 'aut-graz-schwarz-weiss', cupFinalist: 'aut-maria-enzersdorf',
    euro: { cwc: ['aut-wien-gruen'], uefa: ['aut-graz-schwarz-weiss', 'aut-wien-violett'], cl: ['aut-salzburg'] },
  },
  1996: {
    t1: ['aut-salzburg', 'aut-wien-gruen', 'aut-graz-schwarz-weiss', 'aut-innsbruck', 'aut-graz-rot', 'aut-wien-violett', 'aut-linz-schwarz-weiss', 'aut-ried', 'aut-linz-blau-weiss', 'aut-maria-enzersdorf'],
    cup: 'aut-graz-schwarz-weiss', cupFinalist: 'aut-wien-blau-gelb',
    euro: { cwc: ['aut-graz-schwarz-weiss'], uefa: ['aut-innsbruck', 'aut-graz-rot'], cl: ['aut-wien-gruen'] },
  },
  1997: {
    t1: ['aut-graz-schwarz-weiss', 'aut-wien-gruen', 'aut-graz-rot', 'aut-salzburg', 'aut-linz-schwarz-weiss', 'aut-innsbruck', 'aut-wien-violett', 'aut-ried', 'aut-lustenau', 'aut-maria-enzersdorf'],
    cup: 'aut-ried', cupFinalist: 'aut-graz-schwarz-weiss',
    euro: { cwc: ['aut-graz-schwarz-weiss'], uefa: ['aut-wien-gruen', 'aut-salzburg', 'aut-innsbruck'], cl: ['aut-salzburg'] },
  },
  1998: {
    t1: ['aut-graz-schwarz-weiss', 'aut-wien-gruen', 'aut-graz-rot', 'aut-salzburg', 'aut-linz-schwarz-weiss', 'aut-innsbruck', 'aut-wien-violett', 'aut-ried', 'aut-lustenau', 'aut-steyr'],
    cup: 'aut-graz-schwarz-weiss', cupFinalist: 'aut-linz-schwarz-weiss',
    euro: { cwc: ['aut-ried'], uefa: ['aut-wien-gruen', 'aut-graz-rot'], cl: ['aut-graz-schwarz-weiss'] },
  },
  1999: {
    t1: ['aut-innsbruck', 'aut-graz-schwarz-weiss', 'aut-wien-gruen', 'aut-wien-violett', 'aut-ried', 'aut-salzburg', 'aut-graz-rot', 'aut-linz-schwarz-weiss', 'aut-bregenz', 'aut-lustenau'],
    cup: 'aut-graz-rot', cupFinalist: 'aut-salzburg',
    euro: { uefa: ['aut-graz-schwarz-weiss', 'aut-wien-gruen', 'aut-graz-rot', 'aut-linz-schwarz-weiss'], cl: ['aut-graz-schwarz-weiss', 'aut-wien-gruen'] },
  },
  2000: {
    t1: ['aut-innsbruck', 'aut-wien-gruen', 'aut-graz-rot', 'aut-graz-schwarz-weiss', 'aut-wien-violett', 'aut-salzburg', 'aut-ried', 'aut-bregenz', 'aut-maria-enzersdorf', 'aut-linz-schwarz-weiss'],
    cup: 'aut-klagenfurt', cupFinalist: 'aut-innsbruck',
    euro: { uefa: ['aut-innsbruck', 'aut-wien-gruen', 'aut-graz-rot'], cl: ['aut-innsbruck', 'aut-graz-schwarz-weiss'] },
  },
  2001: {
    t1: ['aut-innsbruck', 'aut-graz-schwarz-weiss', 'aut-graz-rot', 'aut-wien-violett', 'aut-klagenfurt', 'aut-salzburg', 'aut-bregenz', 'aut-wien-gruen', 'aut-ried', 'aut-maria-enzersdorf'],
    cup: 'aut-graz-rot', cupFinalist: 'aut-graz-schwarz-weiss',
    euro: { uefa: ['aut-innsbruck', 'aut-graz-rot', 'aut-klagenfurt', 'aut-wien-gruen'], cl: ['aut-innsbruck'] },
  },
  2002: {
    t1: ['aut-wien-violett', 'aut-graz-rot', 'aut-salzburg', 'aut-wien-gruen', 'aut-pasching', 'aut-graz-schwarz-weiss', 'aut-maria-enzersdorf', 'aut-klagenfurt', 'aut-bregenz', 'aut-ried'],
    cup: 'aut-wien-violett', cupFinalist: 'aut-klagenfurt',
    euro: { uefa: ['aut-wien-violett', 'aut-graz-rot', 'aut-graz-schwarz-weiss', 'aut-klagenfurt'], cl: ['aut-graz-rot', 'aut-graz-schwarz-weiss'] },
  },
  2003: {
    t1: ['aut-graz-rot', 'aut-wien-violett', 'aut-pasching', 'aut-wien-gruen', 'aut-bregenz', 'aut-maria-enzersdorf', 'aut-salzburg', 'aut-mattersburg', 'aut-graz-schwarz-weiss', 'aut-klagenfurt'],
    cup: 'aut-graz-rot', cupFinalist: 'aut-wien-violett',
    euro: { uefa: ['aut-graz-rot', 'aut-wien-violett', 'aut-salzburg', 'aut-klagenfurt'], cl: ['aut-graz-rot', 'aut-wien-violett'] },
  },
  2004: {
    t1: ['aut-wien-gruen', 'aut-graz-rot', 'aut-wien-violett', 'aut-pasching', 'aut-mattersburg', 'aut-innsbruck', 'aut-graz-schwarz-weiss', 'aut-maria-enzersdorf', 'aut-salzburg', 'aut-bregenz'],
    cup: 'aut-wien-violett', cupFinalist: 'aut-wien-gruen',
    euro: { uefa: ['aut-wien-gruen', 'aut-graz-rot', 'aut-wien-violett', 'aut-klagenfurt'], cl: ['aut-graz-rot'] },
  },
  2005: {
    t1: ['aut-wien-violett', 'aut-salzburg', 'aut-pasching', 'aut-ried', 'aut-wien-gruen', 'aut-graz-rot', 'aut-mattersburg', 'aut-graz-schwarz-weiss', 'aut-innsbruck', 'aut-maria-enzersdorf'],
    cup: 'aut-wien-violett', cupFinalist: 'aut-mattersburg',
    euro: { uefa: ['aut-wien-violett', 'aut-graz-rot', 'aut-klagenfurt'], cl: ['aut-wien-gruen'] },
  },
  2006: {
    t1: ['aut-salzburg', 'aut-ried', 'aut-mattersburg', 'aut-wien-gruen', 'aut-pasching', 'aut-wien-violett', 'aut-graz-schwarz-weiss', 'aut-altach', 'aut-innsbruck', 'aut-graz-rot'],
    cup: 'aut-wien-violett', cupFinalist: 'aut-mattersburg',
    euro: { uefa: ['aut-salzburg', 'aut-ried', 'aut-mattersburg', 'aut-wien-violett', 'aut-klagenfurt'], cl: ['aut-salzburg', 'aut-wien-violett'] },
  },
  2007: {
    t1: ['aut-wien-gruen', 'aut-salzburg', 'aut-wien-violett', 'aut-graz-schwarz-weiss', 'aut-mattersburg', 'aut-linz-schwarz-weiss', 'aut-ried', 'aut-altach', 'aut-klagenfurt', 'aut-innsbruck'],
    euro: { uefa: ['aut-wien-gruen', 'aut-salzburg', 'aut-wien-violett', 'aut-mattersburg', 'aut-ried'], cl: ['aut-salzburg'] },
    note: 'ÖFB-Cup 2007/08 wegen der Europameisterschaft nicht ausgetragen',
  },
  2008: {
    t1: ['aut-salzburg', 'aut-wien-gruen', 'aut-wien-violett', 'aut-graz-schwarz-weiss', 'aut-ried', 'aut-klagenfurt', 'aut-linz-schwarz-weiss', 'aut-kapfenberg', 'aut-mattersburg', 'aut-altach'],
    cup: 'aut-wien-violett', cupFinalist: 'aut-maria-enzersdorf',
    euro: { uefa: ['aut-salzburg', 'aut-wien-violett', 'aut-graz-schwarz-weiss'], cl: ['aut-wien-gruen'] },
  },
  2009: {
    t1: ['aut-salzburg', 'aut-wien-violett', 'aut-wien-gruen', 'aut-graz-schwarz-weiss', 'aut-wiener-neustadt', 'aut-mattersburg', 'aut-linz-schwarz-weiss', 'aut-ried', 'aut-kapfenberg', 'aut-klagenfurt'],
    cup: 'aut-graz-schwarz-weiss', cupFinalist: 'aut-wiener-neustadt',
    euro: { cl: ['aut-salzburg'], el: ['aut-salzburg', 'aut-wien-violett', 'aut-wien-gruen', 'aut-graz-schwarz-weiss'] },
  },
  2010: {
    t1: ['aut-graz-schwarz-weiss', 'aut-salzburg', 'aut-wien-violett', 'aut-ried', 'aut-wien-gruen', 'aut-innsbruck', 'aut-wiener-neustadt', 'aut-kapfenberg', 'aut-mattersburg', 'aut-linz-schwarz-weiss'],
    cup: 'aut-ried', cupFinalist: 'aut-lustenau',
    euro: { cl: ['aut-salzburg'], el: ['aut-graz-schwarz-weiss', 'aut-salzburg', 'aut-wien-violett', 'aut-wien-gruen'] },
  },
  2011: {
    t1: ['aut-salzburg', 'aut-wien-gruen', 'aut-maria-enzersdorf', 'aut-wien-violett', 'aut-graz-schwarz-weiss', 'aut-ried', 'aut-innsbruck', 'aut-mattersburg', 'aut-wiener-neustadt', 'aut-kapfenberg'],
    cup: 'aut-salzburg', cupFinalist: 'aut-ried',
    euro: { cl: ['aut-graz-schwarz-weiss'], el: ['aut-salzburg', 'aut-wien-violett', 'aut-graz-schwarz-weiss', 'aut-ried'] },
  },
  2012: {
    t1: ['aut-wien-violett', 'aut-salzburg', 'aut-wien-gruen', 'aut-graz-schwarz-weiss', 'aut-wolfsberg', 'aut-ried', 'aut-wiener-neustadt', 'aut-innsbruck', 'aut-maria-enzersdorf', 'aut-mattersburg'],
    cup: 'aut-pasching', cupFinalist: 'aut-wien-violett',
    euro: { cl: ['aut-salzburg'], el: ['aut-wien-gruen', 'aut-ried', 'aut-maria-enzersdorf'] },
  },
  2013: {
    t1: ['aut-salzburg', 'aut-wien-gruen', 'aut-groedig', 'aut-wien-violett', 'aut-graz-schwarz-weiss', 'aut-ried', 'aut-wolfsberg', 'aut-wiener-neustadt', 'aut-maria-enzersdorf', 'aut-innsbruck'],
    cup: 'aut-salzburg', cupFinalist: 'aut-st-poelten',
    euro: { cl: ['aut-salzburg', 'aut-wien-violett'], el: ['aut-salzburg', 'aut-wien-gruen', 'aut-graz-schwarz-weiss', 'aut-pasching'] },
  },
  2014: {
    t1: ['aut-salzburg', 'aut-wien-gruen', 'aut-altach', 'aut-graz-schwarz-weiss', 'aut-wolfsberg', 'aut-ried', 'aut-wien-violett', 'aut-groedig', 'aut-maria-enzersdorf', 'aut-wiener-neustadt'],
    cup: 'aut-salzburg', cupFinalist: 'aut-wien-violett',
    euro: { cl: ['aut-salzburg'], el: ['aut-salzburg', 'aut-wien-gruen', 'aut-groedig', 'aut-st-poelten'] },
  },
  2015: {
    t1: ['aut-salzburg', 'aut-wien-gruen', 'aut-wien-violett', 'aut-maria-enzersdorf', 'aut-graz-schwarz-weiss', 'aut-wolfsberg', 'aut-ried', 'aut-altach', 'aut-mattersburg', 'aut-groedig'],
    cup: 'aut-salzburg', cupFinalist: 'aut-maria-enzersdorf',
    euro: { cl: ['aut-salzburg', 'aut-wien-gruen'], el: ['aut-salzburg', 'aut-wien-gruen', 'aut-graz-schwarz-weiss', 'aut-wolfsberg', 'aut-altach'] },
  },
  2016: {
    t1: ['aut-salzburg', 'aut-wien-violett', 'aut-graz-schwarz-weiss', 'aut-altach', 'aut-wien-gruen', 'aut-maria-enzersdorf', 'aut-mattersburg', 'aut-wolfsberg', 'aut-st-poelten', 'aut-ried'],
    cup: 'aut-salzburg', cupFinalist: 'aut-wien-gruen',
    euro: { cl: ['aut-salzburg'], el: ['aut-salzburg', 'aut-wien-violett', 'aut-wien-gruen', 'aut-maria-enzersdorf'] },
  },
  2017: {
    t1: ['aut-salzburg', 'aut-graz-schwarz-weiss', 'aut-wien-gruen', 'aut-linz-schwarz-weiss', 'aut-maria-enzersdorf', 'aut-mattersburg', 'aut-wien-violett', 'aut-altach', 'aut-wolfsberg', 'aut-st-poelten'],
    cup: 'aut-graz-schwarz-weiss', cupFinalist: 'aut-salzburg',
    euro: { cl: ['aut-salzburg'], el: ['aut-salzburg', 'aut-graz-schwarz-weiss', 'aut-wien-violett', 'aut-altach'] },
  },
  2018: {
    t1: ['aut-salzburg', 'aut-linz-schwarz-weiss', 'aut-wolfsberg', 'aut-wien-violett', 'aut-graz-schwarz-weiss', 'aut-st-poelten', 'aut-wien-gruen', 'aut-mattersburg', 'aut-altach', 'aut-maria-enzersdorf', 'aut-hartberg', 'aut-innsbruck'],
    cup: 'aut-salzburg', cupFinalist: 'aut-wien-gruen',
    euro: { cl: ['aut-salzburg', 'aut-graz-schwarz-weiss'], el: ['aut-salzburg', 'aut-linz-schwarz-weiss', 'aut-graz-schwarz-weiss', 'aut-wien-gruen', 'aut-maria-enzersdorf'] },
  },
  2019: {
    t1: ['aut-salzburg', 'aut-wien-gruen', 'aut-wolfsberg', 'aut-linz-schwarz-weiss', 'aut-hartberg', 'aut-graz-schwarz-weiss', 'aut-wien-violett', 'aut-altach', 'aut-st-poelten', 'aut-mattersburg', 'aut-maria-enzersdorf', 'aut-wattens'],
    cup: 'aut-salzburg', cupFinalist: 'aut-lustenau',
    euro: { cl: ['aut-salzburg', 'aut-linz-schwarz-weiss'], el: ['aut-salzburg', 'aut-wolfsberg', 'aut-linz-schwarz-weiss', 'aut-graz-schwarz-weiss', 'aut-wien-violett'] },
  },
  2020: {
    t1: ['aut-salzburg', 'aut-wien-gruen', 'aut-graz-schwarz-weiss', 'aut-linz-schwarz-weiss', 'aut-wolfsberg', 'aut-wattens', 'aut-hartberg', 'aut-wien-violett', 'aut-ried', 'aut-altach', 'aut-maria-enzersdorf', 'aut-st-poelten'],
    cup: 'aut-salzburg', cupFinalist: 'aut-linz-schwarz-weiss',
    euro: { cl: ['aut-salzburg', 'aut-wien-gruen'], el: ['aut-salzburg', 'aut-wien-gruen', 'aut-linz-schwarz-weiss', 'aut-wolfsberg', 'aut-hartberg'] },
  },
  2021: {
    t1: ['aut-salzburg', 'aut-graz-schwarz-weiss', 'aut-wien-violett', 'aut-wolfsberg', 'aut-wien-gruen', 'aut-klagenfurt', 'aut-wattens', 'aut-linz-schwarz-weiss', 'aut-altach', 'aut-ried', 'aut-hartberg', 'aut-maria-enzersdorf'],
    cup: 'aut-salzburg', cupFinalist: 'aut-ried',
    euro: { cl: ['aut-salzburg', 'aut-wien-gruen'], el: ['aut-graz-schwarz-weiss', 'aut-wien-gruen'], ecl: ['aut-wien-violett', 'aut-wien-gruen', 'aut-linz-schwarz-weiss'] },
  },
  2022: {
    t1: ['aut-salzburg', 'aut-graz-schwarz-weiss', 'aut-linz-schwarz-weiss', 'aut-wien-gruen', 'aut-wien-violett', 'aut-klagenfurt', 'aut-wolfsberg', 'aut-lustenau', 'aut-wattens', 'aut-hartberg', 'aut-altach', 'aut-ried'],
    cup: 'aut-graz-schwarz-weiss', cupFinalist: 'aut-wien-gruen',
    euro: { cl: ['aut-salzburg', 'aut-graz-schwarz-weiss'], el: ['aut-salzburg', 'aut-graz-schwarz-weiss', 'aut-wien-violett'], ecl: ['aut-wien-gruen', 'aut-wien-violett', 'aut-wolfsberg'] },
  },
  2023: {
    t1: ['aut-graz-schwarz-weiss', 'aut-salzburg', 'aut-linz-schwarz-weiss', 'aut-wien-gruen', 'aut-hartberg', 'aut-klagenfurt', 'aut-wolfsberg', 'aut-wien-violett', 'aut-linz-blau-weiss', 'aut-altach', 'aut-wattens', 'aut-lustenau'],
    cup: 'aut-graz-schwarz-weiss', cupFinalist: 'aut-wien-gruen',
    euro: { cl: ['aut-graz-schwarz-weiss', 'aut-salzburg'], el: ['aut-graz-schwarz-weiss', 'aut-linz-schwarz-weiss'], ecl: ['aut-graz-schwarz-weiss', 'aut-wien-gruen', 'aut-wien-violett'] },
  },
  2024: {
    t1: ['aut-graz-schwarz-weiss', 'aut-salzburg', 'aut-wien-violett', 'aut-wolfsberg', 'aut-wien-gruen', 'aut-linz-blau-weiss', 'aut-linz-schwarz-weiss', 'aut-hartberg', 'aut-wattens', 'aut-graz-rot', 'aut-altach', 'aut-klagenfurt'],
    cup: 'aut-wolfsberg', cupFinalist: 'aut-hartberg',
    euro: { cl: ['aut-graz-schwarz-weiss', 'aut-salzburg'], el: ['aut-wien-gruen', 'aut-linz-schwarz-weiss'], ecl: ['aut-wien-violett', 'aut-wien-gruen', 'aut-linz-schwarz-weiss'] },
  },
  2025: {
    t1: ['aut-linz-schwarz-weiss', 'aut-graz-schwarz-weiss', 'aut-salzburg', 'aut-wien-violett', 'aut-wien-gruen', 'aut-hartberg', 'aut-ried', 'aut-wolfsberg', 'aut-altach', 'aut-graz-rot', 'aut-wattens', 'aut-linz-blau-weiss'],
    cup: 'aut-linz-schwarz-weiss', cupFinalist: 'aut-altach',
    euro: { cl: ['aut-graz-schwarz-weiss', 'aut-salzburg'], el: ['aut-wolfsberg', 'aut-salzburg', 'aut-graz-schwarz-weiss'], ecl: ['aut-wien-violett', 'aut-wien-gruen', 'aut-wolfsberg'] },
  },
};
