// =============================================================================
// Weltdaten gre: Alpha Ethniki / Super League je Saison (Schlüssel = Startjahr, 1975 = 1975/76).
// t1 in Reihenfolge der Abschlusstabelle; cup/cupFinalist = Landespokal; euro = Europapokal-Teilnehmer.
// Quellen und Unsicherheiten: docs/recherche/weltvereine_gre.md.
// =============================================================================
import type { SeasonRow } from '../types';

export const SEASONS_GRE: Record<number, SeasonRow> = {
  1975: {
    t1: ['gre-saloniki', 'gre-athen-gelb', 'gre-piraeus', 'gre-athen-gruen', 'gre-saloniki-gelb', 'gre-saloniki-blau-weiss', 'gre-nea-smyrni', 'gre-piraeus-blau-weiss', 'gre-iraklio', 'gre-kastoria', 'gre-patras', 'gre-kavala', 'gre-katerini', 'gre-egaleo', 'gre-serres', 'gre-rhodos', 'gre-peristeri', 'gre-trikala'],
    cup: 'gre-saloniki-blau-weiss', cupFinalist: 'gre-piraeus',
    euro: { ec: ['gre-piraeus'], uefa: ['gre-saloniki', 'gre-athen-gelb'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1976: {
    t1: ['gre-athen-gruen', 'gre-piraeus', 'gre-athen-gelb', 'gre-saloniki', 'gre-saloniki-gelb', 'gre-saloniki-blau-weiss', 'gre-piraeus-blau-weiss', 'gre-nea-smyrni', 'gre-iraklio', 'gre-kastoria', 'gre-patras', 'gre-kavala', 'gre-rhodos', 'gre-katerini', 'gre-egaleo', 'gre-larisa', 'gre-ioannina', 'gre-serres'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-ioannina',
    euro: { ec: ['gre-saloniki'], cwc: ['gre-saloniki-blau-weiss'], uefa: ['gre-piraeus', 'gre-athen-gelb'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1977: {
    t1: ['gre-athen-gelb', 'gre-piraeus', 'gre-athen-gruen', 'gre-saloniki', 'gre-saloniki-gelb', 'gre-piraeus-blau-weiss', 'gre-saloniki-blau-weiss', 'gre-iraklio', 'gre-nea-smyrni', 'gre-kastoria', 'gre-kavala', 'gre-rhodos', 'gre-larisa', 'gre-patras', 'gre-ioannina', 'gre-egaleo', 'gre-katerini', 'gre-athen-blau-weiss'],
    cup: 'gre-athen-gelb', cupFinalist: 'gre-saloniki',
    euro: { ec: ['gre-athen-gruen'], cwc: ['gre-ioannina'], uefa: ['gre-athen-gelb', 'gre-piraeus'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1978: {
    t1: ['gre-athen-gelb', 'gre-piraeus', 'gre-saloniki-gelb', 'gre-saloniki', 'gre-athen-gruen', 'gre-piraeus-blau-weiss', 'gre-saloniki-blau-weiss', 'gre-iraklio', 'gre-nea-smyrni', 'gre-kastoria', 'gre-rhodos', 'gre-larisa', 'gre-kavala', 'gre-patras', 'gre-drama', 'gre-ioannina', 'gre-korinth', 'gre-egaleo'],
    cup: 'gre-nea-smyrni', cupFinalist: 'gre-athen-gelb',
    euro: { ec: ['gre-athen-gelb'], cwc: ['gre-saloniki'], uefa: ['gre-piraeus', 'gre-athen-gruen'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1979: {
    t1: ['gre-piraeus', 'gre-saloniki-gelb', 'gre-athen-gruen', 'gre-saloniki', 'gre-athen-gelb', 'gre-saloniki-blau-weiss', 'gre-piraeus-blau-weiss', 'gre-iraklio', 'gre-kastoria', 'gre-larisa', 'gre-nea-smyrni', 'gre-rhodos', 'gre-kavala', 'gre-drama', 'gre-patras', 'gre-korinth', 'gre-ioannina', 'gre-athen-blau-weiss'],
    cup: 'gre-kastoria', cupFinalist: 'gre-saloniki-blau-weiss',
    euro: { ec: ['gre-athen-gelb'], cwc: ['gre-nea-smyrni'], uefa: ['gre-piraeus', 'gre-saloniki-gelb'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1980: {
    t1: ['gre-piraeus', 'gre-saloniki-gelb', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-saloniki', 'gre-larisa', 'gre-saloniki-blau-weiss', 'gre-piraeus-blau-weiss', 'gre-iraklio', 'gre-kastoria', 'gre-drama', 'gre-nea-smyrni', 'gre-rhodos', 'gre-kavala', 'gre-patras', 'gre-athen-blau-weiss', 'gre-korinth', 'gre-serres'],
    cup: 'gre-piraeus', cupFinalist: 'gre-saloniki',
    euro: { ec: ['gre-piraeus'], cwc: ['gre-kastoria'], uefa: ['gre-saloniki-gelb', 'gre-athen-gruen'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1981: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-saloniki', 'gre-larisa', 'gre-saloniki-gelb', 'gre-saloniki-blau-weiss', 'gre-iraklio', 'gre-piraeus-blau-weiss', 'gre-drama', 'gre-nea-smyrni', 'gre-kastoria', 'gre-rhodos', 'gre-kavala', 'gre-patras', 'gre-athen-blau-weiss', 'gre-egaleo', 'gre-katerini'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-larisa',
    euro: { ec: ['gre-piraeus'], cwc: ['gre-saloniki'], uefa: ['gre-athen-gruen', 'gre-saloniki-gelb'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1982: {
    t1: ['gre-piraeus', 'gre-larisa', 'gre-saloniki', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-saloniki-gelb', 'gre-saloniki-blau-weiss', 'gre-iraklio', 'gre-piraeus-blau-weiss', 'gre-drama', 'gre-nea-smyrni', 'gre-rhodos', 'gre-kavala', 'gre-kastoria', 'gre-patras', 'gre-athen-blau-weiss', 'gre-egaleo', 'gre-korinth'],
    cup: 'gre-athen-gelb', cupFinalist: 'gre-saloniki',
    euro: { ec: ['gre-piraeus'], cwc: ['gre-athen-gruen'], uefa: ['gre-saloniki', 'gre-athen-gelb'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1983: {
    t1: ['gre-athen-gruen', 'gre-piraeus', 'gre-athen-gelb', 'gre-saloniki', 'gre-larisa', 'gre-saloniki-gelb', 'gre-saloniki-blau-weiss', 'gre-iraklio', 'gre-piraeus-blau-weiss', 'gre-drama', 'gre-nea-smyrni', 'gre-athen-blau-weiss', 'gre-kavala', 'gre-rhodos', 'gre-patras', 'gre-kastoria', 'gre-egaleo', 'gre-rhodos-blau-weiss'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-larisa',
    euro: { ec: ['gre-piraeus'], cwc: ['gre-athen-gelb'], uefa: ['gre-saloniki', 'gre-larisa'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1984: {
    t1: ['gre-saloniki', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-piraeus', 'gre-larisa', 'gre-iraklio', 'gre-saloniki-gelb', 'gre-saloniki-blau-weiss', 'gre-piraeus-blau-weiss', 'gre-nea-smyrni', 'gre-drama', 'gre-athen-blau-weiss', 'gre-rhodos', 'gre-kavala', 'gre-patras', 'gre-egaleo', 'gre-rhodos-blau-weiss', 'gre-katerini'],
    cup: 'gre-larisa', cupFinalist: 'gre-saloniki',
    euro: { ec: ['gre-athen-gruen'], cwc: ['gre-larisa'], uefa: ['gre-piraeus'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1985: {
    t1: ['gre-athen-gruen', 'gre-iraklio', 'gre-athen-gelb', 'gre-saloniki', 'gre-piraeus', 'gre-larisa', 'gre-saloniki-blau-weiss', 'gre-saloniki-gelb', 'gre-piraeus-blau-weiss', 'gre-nea-smyrni', 'gre-drama', 'gre-athen-blau-weiss', 'gre-rhodos-blau-weiss', 'gre-egaleo', 'gre-veria', 'gre-kavala', 'gre-patras', 'gre-serres'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-piraeus',
    euro: { ec: ['gre-saloniki'], cwc: ['gre-larisa'], uefa: ['gre-athen-gruen', 'gre-athen-gelb'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1986: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-nea-smyrni', 'gre-iraklio', 'gre-athen-gelb', 'gre-saloniki', 'gre-larisa', 'gre-saloniki-blau-weiss', 'gre-saloniki-gelb', 'gre-piraeus-blau-weiss', 'gre-rhodos-blau-weiss', 'gre-veria', 'gre-serres', 'gre-patras', 'gre-athen-blau-weiss', 'gre-egaleo'],
    cup: 'gre-iraklio', cupFinalist: 'gre-saloniki-blau-weiss',
    euro: { ec: ['gre-athen-gruen'], cwc: ['gre-piraeus'], uefa: ['gre-iraklio', 'gre-athen-gelb'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1987: {
    t1: ['gre-larisa', 'gre-athen-gelb', 'gre-saloniki', 'gre-iraklio', 'gre-athen-gruen', 'gre-saloniki-blau-weiss', 'gre-piraeus-blau-weiss', 'gre-piraeus', 'gre-saloniki-gelb', 'gre-nea-smyrni', 'gre-kalamaria', 'gre-rhodos-blau-weiss', 'gre-livadia', 'gre-veria', 'gre-serres', 'gre-patras'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-piraeus',
    euro: { ec: ['gre-piraeus'], cwc: ['gre-iraklio'], uefa: ['gre-athen-gruen', 'gre-nea-smyrni'] },
  },
  1988: {
    t1: ['gre-athen-gelb', 'gre-piraeus', 'gre-athen-gruen', 'gre-saloniki-blau-weiss', 'gre-iraklio', 'gre-larisa', 'gre-saloniki-gelb', 'gre-saloniki', 'gre-drama', 'gre-nea-smyrni', 'gre-volos-rot', 'gre-livadia', 'gre-athen-blau-weiss', 'gre-piraeus-blau-weiss', 'gre-rhodos-blau-weiss', 'gre-kalamaria'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-nea-smyrni',
    euro: { ec: ['gre-larisa'], cwc: ['gre-athen-gruen'], uefa: ['gre-athen-gelb', 'gre-saloniki'] },
  },
  1989: {
    t1: ['gre-athen-gruen', 'gre-athen-gelb', 'gre-saloniki', 'gre-piraeus', 'gre-saloniki-blau-weiss', 'gre-iraklio', 'gre-saloniki-gelb', 'gre-larisa', 'gre-livadia', 'gre-nea-smyrni', 'gre-drama', 'gre-xanthi', 'gre-serres', 'gre-athen-blau-weiss', 'gre-nikaia', 'gre-kalamaria', 'gre-volos-rot', 'gre-piraeus-blau-weiss'],
    cup: 'gre-piraeus', cupFinalist: 'gre-iraklio',
    euro: { ec: ['gre-athen-gelb'], cwc: ['gre-athen-gruen'], uefa: ['gre-piraeus', 'gre-saloniki-blau-weiss'] },
  },
  1990: {
    t1: ['gre-athen-gruen', 'gre-piraeus', 'gre-athen-gelb', 'gre-saloniki', 'gre-saloniki-blau-weiss', 'gre-athen-vyronas', 'gre-drama', 'gre-iraklio', 'gre-saloniki-gelb', 'gre-nea-smyrni', 'gre-athen-blau-weiss', 'gre-larisa', 'gre-patras', 'gre-serres', 'gre-xanthi', 'gre-nikaia', 'gre-livadia', 'gre-ioannina'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-athen-vyronas',
    euro: { ec: ['gre-athen-gruen'], cwc: ['gre-piraeus'], uefa: ['gre-saloniki', 'gre-saloniki-blau-weiss'] },
  },
  1991: {
    t1: ['gre-athen-gelb', 'gre-piraeus', 'gre-athen-gruen', 'gre-saloniki', 'gre-athen-blau-weiss', 'gre-iraklio', 'gre-saloniki-gelb', 'gre-larisa', 'gre-saloniki-blau-weiss', 'gre-korinth', 'gre-katerini', 'gre-athen-vyronas', 'gre-drama', 'gre-xanthi', 'gre-patras', 'gre-nea-smyrni', 'gre-serres', 'gre-piraeus-blau-weiss'],
    cup: 'gre-piraeus', cupFinalist: 'gre-saloniki',
    euro: { ec: ['gre-athen-gruen'], cwc: ['gre-athen-vyronas'], uefa: ['gre-athen-gelb', 'gre-saloniki'] },
  },
  1992: {
    t1: ['gre-athen-gelb', 'gre-athen-gruen', 'gre-piraeus', 'gre-iraklio', 'gre-saloniki', 'gre-saloniki-blau-weiss', 'gre-larisa', 'gre-xanthi', 'gre-saloniki-gelb', 'gre-athen-vyronas', 'gre-patras', 'gre-athen-blau-weiss', 'gre-drama', 'gre-edessa', 'gre-kalamaria', 'gre-katerini', 'gre-nikaia', 'gre-korinth'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-piraeus',
    euro: { cwc: ['gre-piraeus'], uefa: ['gre-athen-gruen', 'gre-saloniki'], cl: ['gre-athen-gelb'] },
  },
  1993: {
    t1: ['gre-athen-gelb', 'gre-piraeus', 'gre-athen-gruen', 'gre-iraklio', 'gre-saloniki', 'gre-saloniki-blau-weiss', 'gre-saloniki-gelb', 'gre-xanthi', 'gre-athen-blau-weiss', 'gre-larisa', 'gre-edessa', 'gre-athen-vyronas', 'gre-nea-smyrni', 'gre-piraeus-blau-weiss', 'gre-drama', 'gre-kalamaria', 'gre-patras', 'gre-naoussa'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-athen-gelb',
    euro: { cwc: ['gre-athen-gruen'], uefa: ['gre-piraeus', 'gre-iraklio'], cl: ['gre-athen-gelb'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplätze gegen die Europapokal-Teilnahmen geprüft)',
  },
  1994: {
    t1: ['gre-athen-gruen', 'gre-piraeus', 'gre-saloniki', 'gre-athen-blau-weiss', 'gre-athen-gelb', 'gre-saloniki-blau-weiss', 'gre-saloniki-gelb', 'gre-xanthi', 'gre-iraklio', 'gre-edessa', 'gre-larisa', 'gre-athen-vyronas', 'gre-piraeus-blau-weiss', 'gre-nea-smyrni', 'gre-nikaia', 'gre-drama', 'gre-livadia', 'gre-kavala'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-athen-gelb',
    euro: { cwc: ['gre-athen-gruen'], uefa: ['gre-piraeus', 'gre-saloniki-gelb'], cl: ['gre-athen-gelb'] },
  },
  1995: {
    t1: ['gre-athen-gruen', 'gre-athen-gelb', 'gre-piraeus', 'gre-saloniki-blau-weiss', 'gre-iraklio', 'gre-xanthi', 'gre-saloniki-gelb', 'gre-nikaia', 'gre-edessa', 'gre-athen-vyronas', 'gre-saloniki', 'gre-athen-blau-weiss', 'gre-pyrgos', 'gre-kalamata', 'gre-patras', 'gre-larisa', 'gre-nea-smyrni', 'gre-piraeus-blau-weiss'],
    cup: 'gre-athen-gelb', cupFinalist: 'gre-athen-blau-weiss',
    euro: { cwc: ['gre-athen-gelb'], uefa: ['gre-piraeus', 'gre-athen-blau-weiss'], cl: ['gre-athen-gruen'] },
  },
  1996: {
    t1: ['gre-piraeus', 'gre-athen-gelb', 'gre-iraklio', 'gre-saloniki', 'gre-athen-gruen', 'gre-kavala', 'gre-pyrgos', 'gre-nikaia', 'gre-athen-blau-weiss', 'gre-veria', 'gre-kalamata', 'gre-athen-vyronas', 'gre-saloniki-blau-weiss', 'gre-xanthi', 'gre-patras', 'gre-saloniki-gelb', 'gre-edessa', 'gre-kastoria'],
    cup: 'gre-athen-gelb', cupFinalist: 'gre-athen-gruen',
    euro: { cwc: ['gre-athen-gelb'], uefa: ['gre-piraeus', 'gre-athen-gruen', 'gre-saloniki-blau-weiss'], cl: ['gre-athen-gruen'] },
  },
  1997: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-saloniki', 'gre-nikaia', 'gre-saloniki-blau-weiss', 'gre-iraklio', 'gre-xanthi', 'gre-veria', 'gre-nea-smyrni', 'gre-athen-blau-weiss', 'gre-pyrgos', 'gre-kavala', 'gre-korydallos', 'gre-piraeus-blau-weiss', 'gre-patras', 'gre-kalamata', 'gre-athen-vyronas'],
    cup: 'gre-nea-smyrni', cupFinalist: 'gre-athen-gruen',
    euro: { cwc: ['gre-athen-gelb'], uefa: ['gre-saloniki', 'gre-iraklio'], cl: ['gre-piraeus'] },
  },
  1998: {
    t1: ['gre-piraeus', 'gre-athen-gelb', 'gre-athen-gruen', 'gre-saloniki', 'gre-nikaia', 'gre-saloniki-gelb', 'gre-xanthi', 'gre-iraklio', 'gre-saloniki-blau-weiss', 'gre-kavala', 'gre-athen-kaisariani', 'gre-korydallos', 'gre-pyrgos', 'gre-athen-blau-weiss', 'gre-nea-smyrni', 'gre-elefsina', 'gre-veria', 'gre-piraeus-blau-weiss'],
    cup: 'gre-piraeus', cupFinalist: 'gre-athen-gruen',
    euro: { cwc: ['gre-nea-smyrni'], uefa: ['gre-athen-gelb', 'gre-saloniki'], cl: ['gre-piraeus', 'gre-athen-gruen'] },
  },
  1999: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-iraklio', 'gre-saloniki', 'gre-saloniki-blau-weiss', 'gre-saloniki-gelb', 'gre-nea-smyrni', 'gre-kalamata', 'gre-nikaia', 'gre-xanthi', 'gre-athen-kaisariani', 'gre-pyrgos', 'gre-patras', 'gre-kavala', 'gre-korydallos', 'gre-athen-blau-weiss', 'gre-trikala'],
    cup: 'gre-athen-gelb', cupFinalist: 'gre-nikaia',
    euro: { uefa: ['gre-piraeus', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-saloniki', 'gre-saloniki-gelb', 'gre-nikaia'], cl: ['gre-piraeus', 'gre-athen-gelb'] },
  },
  2000: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-saloniki', 'gre-saloniki-blau-weiss', 'gre-nikaia', 'gre-saloniki-gelb', 'gre-xanthi', 'gre-nea-smyrni', 'gre-athen-kaisariani', 'gre-patras', 'gre-iraklio', 'gre-ioannina', 'gre-pyrgos', 'gre-kalamata', 'gre-athen-vyronas'],
    cup: 'gre-saloniki', cupFinalist: 'gre-piraeus',
    euro: { uefa: ['gre-piraeus', 'gre-athen-gelb', 'gre-saloniki', 'gre-saloniki-blau-weiss', 'gre-iraklio'], cl: ['gre-piraeus', 'gre-athen-gruen'] },
  },
  2001: {
    t1: ['gre-piraeus', 'gre-athen-gelb', 'gre-athen-gruen', 'gre-saloniki', 'gre-xanthi', 'gre-saloniki-blau-weiss', 'gre-nea-smyrni', 'gre-iraklio', 'gre-saloniki-gelb', 'gre-egaleo', 'gre-ano-liosia', 'gre-nikaia', 'gre-patras', 'gre-athen-kaisariani'],
    cup: 'gre-athen-gelb', cupFinalist: 'gre-piraeus',
    euro: { uefa: ['gre-athen-gelb', 'gre-saloniki'], cl: ['gre-piraeus', 'gre-athen-gruen'] },
  },
  2002: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-saloniki', 'gre-nea-smyrni', 'gre-saloniki-gelb', 'gre-saloniki-blau-weiss', 'gre-iraklio', 'gre-xanthi', 'gre-egaleo', 'gre-korydallos', 'gre-ano-liosia', 'gre-kallithea', 'gre-ioannina', 'gre-nikaia', 'gre-patras'],
    cup: 'gre-saloniki', cupFinalist: 'gre-saloniki-gelb',
    euro: { uefa: ['gre-athen-gruen', 'gre-athen-gelb', 'gre-saloniki', 'gre-saloniki-blau-weiss', 'gre-xanthi'], cl: ['gre-piraeus', 'gre-athen-gelb'] },
  },
  2003: {
    t1: ['gre-athen-gruen', 'gre-piraeus', 'gre-saloniki', 'gre-athen-gelb', 'gre-egaleo', 'gre-nea-smyrni', 'gre-agios-ioannis-rentis', 'gre-saloniki-blau-weiss', 'gre-nikaia', 'gre-xanthi', 'gre-iraklio', 'gre-kallithea', 'gre-saloniki-gelb', 'gre-ano-liosia', 'gre-pyrgos', 'gre-korydallos'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-piraeus',
    euro: { uefa: ['gre-athen-gruen', 'gre-saloniki', 'gre-nea-smyrni', 'gre-saloniki-gelb'], cl: ['gre-athen-gruen', 'gre-piraeus', 'gre-athen-gelb'] },
  },
  2004: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-xanthi', 'gre-saloniki', 'gre-egaleo', 'gre-saloniki-blau-weiss', 'gre-agios-ioannis-rentis', 'gre-kallithea', 'gre-nikaia', 'gre-nea-smyrni', 'gre-kalamaria', 'gre-iraklio', 'gre-saloniki-gelb', 'gre-iraklio-gelb-schwarz', 'gre-korfu'],
    cup: 'gre-piraeus', cupFinalist: 'gre-saloniki-gelb',
    euro: { uefa: ['gre-piraeus', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-saloniki', 'gre-egaleo', 'gre-nea-smyrni'], cl: ['gre-piraeus', 'gre-athen-gruen', 'gre-saloniki'] },
  },
  2005: {
    t1: ['gre-piraeus', 'gre-athen-gelb', 'gre-athen-gruen', 'gre-saloniki-blau-weiss', 'gre-xanthi', 'gre-saloniki', 'gre-peristeri', 'gre-larisa', 'gre-kalamaria', 'gre-egaleo', 'gre-nea-smyrni', 'gre-nikaia', 'gre-iraklio', 'gre-livadia', 'gre-kallithea', 'gre-ano-liosia'],
    cup: 'gre-piraeus', cupFinalist: 'gre-athen-gelb',
    euro: { uefa: ['gre-athen-gelb', 'gre-xanthi', 'gre-saloniki', 'gre-saloniki-gelb'], cl: ['gre-piraeus', 'gre-athen-gruen'] },
  },
  2006: {
    t1: ['gre-piraeus', 'gre-athen-gelb', 'gre-athen-gruen', 'gre-saloniki-gelb', 'gre-nea-smyrni', 'gre-saloniki', 'gre-iraklio', 'gre-peristeri', 'gre-iraklio-gelb-schwarz', 'gre-xanthi', 'gre-larisa', 'gre-kalamaria', 'gre-korfu', 'gre-saloniki-blau-weiss', 'gre-egaleo', 'gre-nikaia'],
    cup: 'gre-larisa', cupFinalist: 'gre-athen-gruen',
    euro: { uefa: ['gre-athen-gelb', 'gre-athen-gruen', 'gre-peristeri', 'gre-xanthi', 'gre-saloniki-blau-weiss'], cl: ['gre-piraeus', 'gre-athen-gelb'] },
  },
  2007: {
    t1: ['gre-piraeus', 'gre-athen-gelb', 'gre-athen-gruen', 'gre-saloniki-gelb', 'gre-nea-smyrni', 'gre-larisa', 'gre-tripoli', 'gre-xanthi', 'gre-saloniki', 'gre-saloniki-blau-weiss', 'gre-livadia', 'gre-iraklio', 'gre-iraklio-gelb-schwarz', 'gre-peristeri', 'gre-kalamaria', 'gre-veria'],
    cup: 'gre-piraeus', cupFinalist: 'gre-saloniki-gelb',
    euro: { uefa: ['gre-athen-gelb', 'gre-athen-gruen', 'gre-saloniki-gelb', 'gre-nea-smyrni', 'gre-larisa'], cl: ['gre-piraeus', 'gre-athen-gelb'] },
  },
  2008: {
    t1: ['gre-piraeus', 'gre-saloniki', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-larisa', 'gre-saloniki-gelb', 'gre-xanthi', 'gre-nea-smyrni', 'gre-iraklio-gelb-schwarz', 'gre-saloniki-blau-weiss', 'gre-komotini', 'gre-tripoli', 'gre-livadia', 'gre-iraklio', 'gre-serres', 'gre-fyli'],
    cup: 'gre-piraeus', cupFinalist: 'gre-athen-gelb',
    euro: { uefa: ['gre-piraeus', 'gre-athen-gelb', 'gre-saloniki-gelb'], cl: ['gre-piraeus', 'gre-athen-gruen'] },
  },
  2009: {
    t1: ['gre-athen-gruen', 'gre-piraeus', 'gre-saloniki', 'gre-athen-gelb', 'gre-saloniki-gelb', 'gre-kavala', 'gre-peristeri', 'gre-larisa', 'gre-nea-smyrni', 'gre-saloniki-blau-weiss', 'gre-iraklio-gelb-schwarz', 'gre-tripoli', 'gre-xanthi', 'gre-livadia', 'gre-ioannina', 'gre-komotini'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-saloniki-gelb',
    euro: { cl: ['gre-athen-gruen', 'gre-piraeus'], el: ['gre-athen-gruen', 'gre-saloniki', 'gre-athen-gelb', 'gre-larisa'] },
  },
  2010: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-saloniki', 'gre-saloniki-gelb', 'gre-iraklio-gelb-schwarz', 'gre-xanthi', 'gre-nea-smyrni', 'gre-saloniki-blau-weiss', 'gre-peristeri', 'gre-korfu', 'gre-tripoli', 'gre-larisa', 'gre-serres', 'gre-volos-rot', 'gre-kavala'],
    cup: 'gre-athen-gelb', cupFinalist: 'gre-peristeri',
    euro: { cl: ['gre-athen-gruen', 'gre-saloniki'], el: ['gre-piraeus', 'gre-athen-gelb', 'gre-saloniki', 'gre-saloniki-gelb'] },
    note: 'Volos Rot und Kavala wegen Spielmanipulation nachträglich zwangsabgestiegen (ans Tabellenende gesetzt)',
  },
  2011: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-saloniki', 'gre-peristeri', 'gre-athen-gelb', 'gre-tripoli', 'gre-saloniki-gelb', 'gre-livadia', 'gre-ioannina', 'gre-iraklio', 'gre-xanthi', 'gre-nea-smyrni', 'gre-korfu', 'gre-iraklio-gelb-schwarz', 'gre-agrinio', 'gre-drama'],
    cup: 'gre-piraeus', cupFinalist: 'gre-peristeri',
    euro: { cl: ['gre-piraeus', 'gre-athen-gruen'], el: ['gre-piraeus', 'gre-athen-gruen', 'gre-saloniki', 'gre-athen-gelb', 'gre-volos-rot'] },
  },
  2012: {
    t1: ['gre-piraeus', 'gre-saloniki', 'gre-tripoli', 'gre-peristeri', 'gre-ioannina', 'gre-athen-gruen', 'gre-xanthi', 'gre-nea-smyrni', 'gre-chania', 'gre-komotini', 'gre-livadia', 'gre-veria', 'gre-saloniki-gelb', 'gre-iraklio', 'gre-athen-gelb', 'gre-korfu'],
    cup: 'gre-piraeus', cupFinalist: 'gre-tripoli',
    euro: { cl: ['gre-piraeus', 'gre-athen-gruen'], el: ['gre-piraeus', 'gre-saloniki', 'gre-tripoli', 'gre-peristeri', 'gre-athen-gruen'] },
  },
  2013: {
    t1: ['gre-piraeus', 'gre-saloniki', 'gre-peristeri', 'gre-athen-gruen', 'gre-tripoli', 'gre-iraklio', 'gre-iraklio-gelb-schwarz', 'gre-agrinio', 'gre-livadia', 'gre-komotini', 'gre-ioannina', 'gre-kalloni', 'gre-nea-smyrni', 'gre-chania', 'gre-veria', 'gre-xanthi', 'gre-athen-blau-weiss', 'gre-saloniki-gelb'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-saloniki',
    euro: { cl: ['gre-piraeus', 'gre-saloniki'], el: ['gre-saloniki', 'gre-peristeri', 'gre-tripoli', 'gre-xanthi'] },
  },
  2014: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-saloniki', 'gre-tripoli', 'gre-peristeri', 'gre-ioannina', 'gre-agrinio', 'gre-chania', 'gre-xanthi', 'gre-kalloni', 'gre-nea-smyrni', 'gre-veria', 'gre-korfu', 'gre-komotini', 'gre-livadia', 'gre-iraklio-gelb-schwarz', 'gre-iraklio', 'gre-volos-blau-weiss'],
    cup: 'gre-piraeus', cupFinalist: 'gre-xanthi',
    euro: { cl: ['gre-piraeus', 'gre-athen-gruen'], el: ['gre-piraeus', 'gre-athen-gruen', 'gre-saloniki', 'gre-tripoli', 'gre-peristeri'] },
    note: 'Volos Blau-Weiß im Winter ausgeschlossen; Meister Piräus gesetzt (Datensatz vermischt Play-off-Spiele)',
  },
  2015: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-saloniki', 'gre-nea-smyrni', 'gre-ioannina', 'gre-peristeri', 'gre-tripoli', 'gre-chania', 'gre-livadia', 'gre-agrinio', 'gre-saloniki-blau-weiss', 'gre-xanthi', 'gre-veria', 'gre-komotini', 'gre-kalloni'],
    cup: 'gre-athen-gelb', cupFinalist: 'gre-piraeus',
    euro: { cl: ['gre-piraeus', 'gre-athen-gruen'], el: ['gre-piraeus', 'gre-athen-gruen', 'gre-saloniki', 'gre-peristeri', 'gre-tripoli'] },
  },
  2016: {
    t1: ['gre-piraeus', 'gre-saloniki', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-nea-smyrni', 'gre-xanthi', 'gre-chania', 'gre-peristeri', 'gre-ioannina', 'gre-korfu', 'gre-agrinio', 'gre-saloniki-blau-weiss', 'gre-tripoli', 'gre-larisa', 'gre-livadia', 'gre-veria'],
    cup: 'gre-saloniki', cupFinalist: 'gre-athen-gelb',
    euro: { cl: ['gre-piraeus', 'gre-saloniki'], el: ['gre-piraeus', 'gre-saloniki', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-ioannina'] },
  },
  2017: {
    t1: ['gre-athen-gelb', 'gre-saloniki', 'gre-piraeus', 'gre-peristeri', 'gre-tripoli', 'gre-xanthi', 'gre-athen-gruen', 'gre-nea-smyrni', 'gre-agrinio', 'gre-ioannina', 'gre-livadia', 'gre-larisa', 'gre-lamia', 'gre-athen-blau-weiss', 'gre-korfu', 'gre-chania'],
    cup: 'gre-saloniki', cupFinalist: 'gre-athen-gelb',
    euro: { cl: ['gre-athen-gelb', 'gre-piraeus'], el: ['gre-athen-gelb', 'gre-saloniki', 'gre-athen-gruen', 'gre-nea-smyrni'] },
  },
  2018: {
    t1: ['gre-saloniki', 'gre-piraeus', 'gre-athen-gelb', 'gre-peristeri', 'gre-saloniki-gelb', 'gre-athen-gruen', 'gre-nea-smyrni', 'gre-lamia', 'gre-agrinio', 'gre-larisa', 'gre-tripoli', 'gre-xanthi', 'gre-iraklio', 'gre-ioannina', 'gre-livadia', 'gre-athen-blau-weiss'],
    cup: 'gre-saloniki', cupFinalist: 'gre-athen-gelb',
    euro: { cl: ['gre-saloniki', 'gre-athen-gelb'], el: ['gre-saloniki', 'gre-piraeus', 'gre-peristeri', 'gre-tripoli'] },
  },
  2019: {
    t1: ['gre-piraeus', 'gre-saloniki', 'gre-athen-gelb', 'gre-athen-gruen', 'gre-saloniki-gelb', 'gre-iraklio', 'gre-tripoli', 'gre-peristeri', 'gre-larisa', 'gre-lamia', 'gre-volos', 'gre-agrinio', 'gre-nea-smyrni', 'gre-xanthi'],
    cup: 'gre-piraeus', cupFinalist: 'gre-athen-gelb',
    euro: { cl: ['gre-piraeus', 'gre-saloniki'], el: ['gre-piraeus', 'gre-saloniki', 'gre-athen-gelb', 'gre-saloniki-gelb', 'gre-peristeri'] },
    note: 'Xanthi vom Verband zwangsabgestiegen (ans Tabellenende gesetzt); Saloniki −7 Punkte',
  },
  2020: {
    t1: ['gre-piraeus', 'gre-saloniki', 'gre-saloniki-gelb', 'gre-athen-gelb', 'gre-athen-gruen', 'gre-tripoli', 'gre-volos', 'gre-peristeri', 'gre-ioannina', 'gre-lamia', 'gre-athen-blau-weiss', 'gre-iraklio', 'gre-agrinio', 'gre-larisa'],
    cup: 'gre-saloniki', cupFinalist: 'gre-piraeus',
    euro: { cl: ['gre-piraeus', 'gre-saloniki'], el: ['gre-piraeus', 'gre-saloniki', 'gre-saloniki-gelb', 'gre-athen-gelb', 'gre-iraklio'] },
  },
  2021: {
    t1: ['gre-piraeus', 'gre-saloniki', 'gre-saloniki-gelb', 'gre-athen-gruen', 'gre-athen-gelb', 'gre-ioannina', 'gre-nikaia', 'gre-iraklio', 'gre-tripoli', 'gre-volos', 'gre-agrinio', 'gre-peristeri', 'gre-lamia', 'gre-athen-blau-weiss'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-saloniki',
    euro: { cl: ['gre-piraeus'], el: ['gre-piraeus'], ecl: ['gre-saloniki', 'gre-saloniki-gelb', 'gre-athen-gelb'] },
  },
  2022: {
    t1: ['gre-athen-gelb', 'gre-athen-gruen', 'gre-piraeus', 'gre-saloniki', 'gre-saloniki-gelb', 'gre-volos', 'gre-iraklio', 'gre-peristeri', 'gre-ioannina', 'gre-tripoli', 'gre-agrinio', 'gre-lamia', 'gre-nikaia', 'gre-livadia'],
    cup: 'gre-athen-gelb', cupFinalist: 'gre-saloniki',
    euro: { cl: ['gre-piraeus'], el: ['gre-piraeus'], ecl: ['gre-athen-gruen', 'gre-saloniki', 'gre-saloniki-gelb'] },
  },
  2023: {
    t1: ['gre-saloniki', 'gre-athen-gelb', 'gre-piraeus', 'gre-athen-gruen', 'gre-saloniki-gelb', 'gre-lamia', 'gre-serres', 'gre-tripoli', 'gre-agrinio', 'gre-iraklio', 'gre-peristeri', 'gre-volos', 'gre-kifisia', 'gre-ioannina'],
    cup: 'gre-athen-gruen', cupFinalist: 'gre-saloniki-gelb',
    euro: { cl: ['gre-athen-gelb', 'gre-athen-gruen'], el: ['gre-athen-gelb', 'gre-piraeus', 'gre-athen-gruen'], ecl: ['gre-saloniki', 'gre-piraeus', 'gre-saloniki-gelb'] },
  },
  2024: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-saloniki', 'gre-athen-gelb', 'gre-saloniki-gelb', 'gre-tripoli', 'gre-peristeri', 'gre-iraklio', 'gre-livadia', 'gre-agrinio', 'gre-volos', 'gre-serres', 'gre-kallithea', 'gre-lamia'],
    cup: 'gre-iraklio', cupFinalist: 'gre-athen-gruen',
    euro: { cl: ['gre-saloniki'], el: ['gre-piraeus', 'gre-athen-gruen', 'gre-saloniki'], ecl: ['gre-athen-gruen', 'gre-athen-gelb'] },
  },
  2025: {
    t1: ['gre-piraeus', 'gre-athen-gruen', 'gre-saloniki', 'gre-athen-gelb', 'gre-saloniki-gelb', 'gre-livadia', 'gre-agrinio', 'gre-tripoli', 'gre-peristeri', 'gre-volos', 'gre-iraklio', 'gre-serres', 'gre-larisa', 'gre-kifisia'],
    euro: { cl: ['gre-piraeus', 'gre-athen-gruen'], el: ['gre-athen-gruen', 'gre-saloniki'], ecl: ['gre-athen-gelb', 'gre-saloniki-gelb'] },
    note: 'Laufende Saison: Zusammensetzung zu Saisonbeginn (Reihenfolge = Vorjahresplatz, Aufsteiger hinten)',
  },
};
