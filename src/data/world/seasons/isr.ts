// =============================================================================
// Weltdaten isr: Liga Leumit / Ligat ha’Al je Saison (Schlüssel = Startjahr, 1975 = 1975/76).
// t1 in Reihenfolge der Abschlusstabelle; cup/cupFinalist = Landespokal; euro = Europapokal-Teilnehmer.
// Quellen und Unsicherheiten: docs/recherche/weltvereine_isr.md.
// =============================================================================
import type { SeasonRow } from '../types';

export const SEASONS_ISR: Record<number, SeasonRow> = {
  1992: {
    t1: ['isr-jerusalem-gelb-schwarz', 'isr-haifa-gruen', 'isr-tel-aviv-gelb-blau', 'isr-petach-tikva-rot', 'isr-tel-aviv-hatikva', 'isr-beer-sheva', 'isr-tel-aviv-rot', 'isr-haifa-rot', 'isr-petach-tikva-blau', 'isr-kfar-saba', 'isr-netanya', 'isr-holon', 'isr-ashdod', 'isr-jerusalem-rot', 'isr-herzlia', 'isr-tel-aviv-shimshon'],
    cup: 'isr-haifa-gruen',
    euro: { cl: ['isr-tel-aviv-gelb-blau'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1993: {
    t1: ['isr-haifa-gruen', 'isr-beer-sheva', 'isr-jerusalem-gelb-schwarz', 'isr-tel-aviv-gelb-blau', 'isr-petach-tikva-rot', 'isr-tel-aviv-hatikva', 'isr-tel-aviv-rot', 'isr-haifa-rot', 'isr-petach-tikva-blau', 'isr-kfar-saba', 'isr-netanya', 'isr-holon', 'isr-ashdod', 'isr-jerusalem-rot', 'isr-herzlia', 'isr-tel-aviv-shimshon'],
    cup: 'isr-tel-aviv-gelb-blau',
    euro: { cwc: ['isr-haifa-gruen'], cl: ['isr-jerusalem-gelb-schwarz'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1994: {
    t1: ['isr-tel-aviv-gelb-blau', 'isr-beer-sheva', 'isr-jerusalem-gelb-schwarz', 'isr-haifa-gruen', 'isr-petach-tikva-rot', 'isr-tel-aviv-hatikva', 'isr-tel-aviv-rot', 'isr-haifa-rot', 'isr-petach-tikva-blau', 'isr-kfar-saba', 'isr-netanya', 'isr-holon', 'isr-ashdod', 'isr-jerusalem-rot', 'isr-herzlia', 'isr-tel-aviv-shimshon'],
    cup: 'isr-haifa-gruen',
    euro: { cwc: ['isr-tel-aviv-gelb-blau'], uefa: ['isr-beer-sheva'], cl: ['isr-haifa-gruen'] },
    note: 'Tabelle aus Wissen, ungeprüft (Meister und Europapokalplatz gegen die Europapokal-Teilnahmen geprüft)',
  },
  1995: {
    t1: ['isr-tel-aviv-gelb-blau', 'isr-haifa-gruen', 'isr-jerusalem-gelb-schwarz', 'isr-haifa-rot', 'isr-tel-aviv-rot', 'isr-petach-tikva-blau', 'isr-herzlia', 'isr-petach-tikva-rot', 'isr-rischon-lezion', 'isr-beer-sheva', 'isr-tel-aviv-hatikva', 'isr-kfar-saba', 'isr-holon', 'isr-beit-shean', 'isr-tel-aviv-gelb-schwarz', 'isr-jaffa'],
    cup: 'isr-tel-aviv-gelb-blau',
    euro: { cwc: ['isr-haifa-gruen'], uefa: ['isr-tel-aviv-rot', 'isr-beer-sheva'], cl: ['isr-tel-aviv-gelb-blau'] },
  },
  1996: {
    t1: ['isr-jerusalem-gelb-schwarz', 'isr-petach-tikva-rot', 'isr-beer-sheva', 'isr-petach-tikva-blau', 'isr-haifa-gruen', 'isr-tel-aviv-gelb-blau', 'isr-haifa-rot', 'isr-kfar-saba', 'isr-rischon-lezion', 'isr-tel-aviv-hatikva', 'isr-jerusalem-rot', 'isr-beit-shean', 'isr-tel-aviv-rot', 'isr-herzlia', 'isr-holon', 'isr-taibe'],
    cup: 'isr-beer-sheva',
    euro: { uefa: ['isr-jerusalem-gelb-schwarz', 'isr-haifa-gruen', 'isr-tel-aviv-gelb-blau'], cl: ['isr-tel-aviv-gelb-blau'] },
  },
  1997: {
    t1: ['isr-jerusalem-gelb-schwarz', 'isr-tel-aviv-rot', 'isr-haifa-rot', 'isr-haifa-gruen', 'isr-petach-tikva-rot', 'isr-tel-aviv-gelb-blau', 'isr-kfar-saba', 'isr-herzlia', 'isr-rischon-lezion', 'isr-petach-tikva-blau', 'isr-jerusalem-rot', 'isr-ashdod', 'isr-beit-shean', 'isr-tel-aviv-hatikva', 'isr-beer-sheva', 'isr-aschkelon'],
    cup: 'isr-haifa-gruen',
    euro: { cwc: ['isr-beer-sheva'], uefa: ['isr-jerusalem-gelb-schwarz', 'isr-petach-tikva-rot'], cl: ['isr-jerusalem-gelb-schwarz'] },
  },
  1998: {
    t1: ['isr-haifa-rot', 'isr-tel-aviv-gelb-blau', 'isr-haifa-gruen', 'isr-jerusalem-gelb-schwarz', 'isr-tel-aviv-rot', 'isr-petach-tikva-rot', 'isr-rischon-lezion', 'isr-kfar-saba', 'isr-jerusalem-rot', 'isr-petach-tikva-blau', 'isr-ashdod', 'isr-tel-aviv-hatikva', 'isr-herzlia', 'isr-holon', 'isr-beit-shean', 'isr-jaffa'],
    cup: 'isr-tel-aviv-rot',
    euro: { cwc: ['isr-haifa-gruen'], uefa: ['isr-jerusalem-gelb-schwarz', 'isr-tel-aviv-rot'], cl: ['isr-jerusalem-gelb-schwarz'] },
  },
  1999: {
    t1: ['isr-tel-aviv-rot', 'isr-haifa-gruen', 'isr-petach-tikva-rot', 'isr-tel-aviv-gelb-blau', 'isr-petach-tikva-blau', 'isr-haifa-rot', 'isr-jerusalem-gelb-schwarz', 'isr-ashdod', 'isr-rischon-lezion', 'isr-netanya', 'isr-kfar-saba', 'isr-tel-aviv-hatikva', 'isr-herzlia', 'isr-jerusalem-rot'],
    cup: 'isr-tel-aviv-rot',
    euro: { uefa: ['isr-tel-aviv-rot', 'isr-tel-aviv-gelb-blau', 'isr-haifa-rot'], cl: ['isr-haifa-rot'] },
  },
  2000: {
    t1: ['isr-haifa-gruen', 'isr-tel-aviv-rot', 'isr-haifa-rot', 'isr-tel-aviv-gelb-blau', 'isr-jerusalem-gelb-schwarz', 'isr-netanya', 'isr-petach-tikva-blau', 'isr-petach-tikva-rot', 'isr-rischon-lezion', 'isr-ashdod', 'isr-tel-aviv-hatikva', 'isr-holon'],
    cup: 'isr-tel-aviv-gelb-blau',
    euro: { uefa: ['isr-haifa-gruen', 'isr-jerusalem-gelb-schwarz'], cl: ['isr-tel-aviv-rot'] },
  },
  2001: {
    t1: ['isr-haifa-gruen', 'isr-tel-aviv-rot', 'isr-tel-aviv-gelb-blau', 'isr-ashdod', 'isr-beer-sheva', 'isr-petach-tikva-rot', 'isr-netanya', 'isr-jerusalem-gelb-schwarz', 'isr-petach-tikva-blau', 'isr-rischon-lezion', 'isr-haifa-rot', 'isr-kiryat-ata'],
    cup: 'isr-tel-aviv-gelb-blau',
    euro: { uefa: ['isr-tel-aviv-rot', 'isr-tel-aviv-gelb-blau'], cl: ['isr-haifa-gruen'] },
  },
  2002: {
    t1: ['isr-tel-aviv-gelb-blau', 'isr-haifa-gruen', 'isr-tel-aviv-rot', 'isr-netanya', 'isr-beer-sheva', 'isr-petach-tikva-blau', 'isr-ashdod', 'isr-petach-tikva-rot', 'isr-jerusalem-gelb-schwarz', 'isr-tel-aviv-hatikva', 'isr-kfar-saba', 'isr-rischon-lezion'],
    cup: 'isr-ramat-gan-rot',
    euro: { uefa: ['isr-tel-aviv-gelb-blau', 'isr-haifa-gruen', 'isr-tel-aviv-rot'], cl: ['isr-haifa-gruen'] },
  },
  2003: {
    t1: ['isr-haifa-gruen', 'isr-tel-aviv-gelb-blau', 'isr-petach-tikva-blau', 'isr-beer-sheva', 'isr-tel-aviv-rot', 'isr-tel-aviv-hatikva', 'isr-ashdod', 'isr-petach-tikva-rot', 'isr-jerusalem-gelb-schwarz', 'isr-sachnin', 'isr-netanya', 'isr-nazareth'],
    cup: 'isr-sachnin',
    euro: { uefa: ['isr-haifa-gruen', 'isr-tel-aviv-rot', 'isr-ramat-gan-rot'], cl: ['isr-tel-aviv-gelb-blau'] },
  },
  2004: {
    t1: ['isr-haifa-gruen', 'isr-petach-tikva-blau', 'isr-ashdod', 'isr-jerusalem-gelb-schwarz', 'isr-nof-hagalil', 'isr-tel-aviv-hatikva', 'isr-petach-tikva-rot', 'isr-tel-aviv-gelb-blau', 'isr-tel-aviv-rot', 'isr-sachnin', 'isr-haifa-rot', 'isr-beer-sheva'],
    cup: 'isr-tel-aviv-gelb-blau',
    euro: { uefa: ['isr-haifa-gruen', 'isr-petach-tikva-blau', 'isr-sachnin'], cl: ['isr-haifa-gruen', 'isr-tel-aviv-gelb-blau'] },
  },
  2005: {
    t1: ['isr-haifa-gruen', 'isr-tel-aviv-rot', 'isr-jerusalem-gelb-schwarz', 'isr-tel-aviv-hatikva', 'isr-petach-tikva-blau', 'isr-tel-aviv-gelb-blau', 'isr-netanya', 'isr-ashdod', 'isr-petach-tikva-rot', 'isr-nof-hagalil', 'isr-kfar-saba', 'isr-sachnin'],
    cup: 'isr-tel-aviv-rot',
    euro: { uefa: ['isr-petach-tikva-blau', 'isr-tel-aviv-gelb-blau', 'isr-ashdod'], cl: ['isr-haifa-gruen'] },
  },
  2006: {
    t1: ['isr-jerusalem-gelb-schwarz', 'isr-netanya', 'isr-tel-aviv-gelb-blau', 'isr-tel-aviv-rot', 'isr-haifa-gruen', 'isr-petach-tikva-blau', 'isr-ashdod', 'isr-kfar-saba', 'isr-tel-aviv-hatikva', 'isr-herzlia', 'isr-ramat-gan-blau-weiss', 'isr-petach-tikva-rot'],
    cup: 'isr-tel-aviv-rot',
    euro: { uefa: ['isr-jerusalem-gelb-schwarz', 'isr-tel-aviv-rot', 'isr-haifa-gruen', 'isr-tel-aviv-hatikva'], cl: ['isr-haifa-gruen'] },
  },
  2007: {
    t1: ['isr-jerusalem-gelb-schwarz', 'isr-netanya', 'isr-kiryat-schmona', 'isr-sachnin', 'isr-haifa-gruen', 'isr-tel-aviv-rot', 'isr-tel-aviv-gelb-blau', 'isr-ashdod', 'isr-tel-aviv-hatikva', 'isr-petach-tikva-blau', 'isr-kfar-saba', 'isr-herzlia'],
    cup: 'isr-jerusalem-gelb-schwarz',
    euro: { uefa: ['isr-netanya', 'isr-tel-aviv-rot', 'isr-tel-aviv-gelb-blau'], cl: ['isr-jerusalem-gelb-schwarz'] },
  },
  2008: {
    t1: ['isr-haifa-gruen', 'isr-tel-aviv-rot', 'isr-jerusalem-gelb-schwarz', 'isr-netanya', 'isr-tel-aviv-hatikva', 'isr-tel-aviv-gelb-blau', 'isr-petach-tikva-blau', 'isr-ashdod', 'isr-sachnin', 'isr-petach-tikva-rot', 'isr-ramat-gan-blau-weiss', 'isr-kiryat-schmona'],
    cup: 'isr-jerusalem-gelb-schwarz',
    euro: { uefa: ['isr-tel-aviv-rot', 'isr-netanya', 'isr-kiryat-schmona'], cl: ['isr-jerusalem-gelb-schwarz'] },
  },
  2009: {
    t1: ['isr-tel-aviv-rot', 'isr-haifa-gruen', 'isr-tel-aviv-gelb-blau', 'isr-tel-aviv-hatikva', 'isr-jerusalem-gelb-schwarz', 'isr-ashdod', 'isr-sachnin', 'isr-petach-tikva-blau', 'isr-beer-sheva', 'isr-netanya', 'isr-akko', 'isr-petach-tikva-rot', 'isr-haifa-rot', 'isr-ramat-gan-rot', 'isr-raanana', 'isr-nazareth'],
    cup: 'isr-tel-aviv-rot',
    euro: { cl: ['isr-haifa-gruen'], el: ['isr-tel-aviv-rot', 'isr-tel-aviv-hatikva', 'isr-netanya'] },
    note: 'Nach 30 Runden Punkte halbiert, dann Meister-, Mittel- und Abstiegsrunde',
  },
  2010: {
    t1: ['isr-haifa-gruen', 'isr-tel-aviv-rot', 'isr-tel-aviv-gelb-blau', 'isr-tel-aviv-hatikva', 'isr-kiryat-schmona', 'isr-netanya', 'isr-petach-tikva-blau', 'isr-akko', 'isr-haifa-rot', 'isr-jerusalem-gelb-schwarz', 'isr-ashdod', 'isr-petach-tikva-rot', 'isr-sachnin', 'isr-beer-sheva', 'isr-aschkelon', 'isr-ramat-gan-rot'],
    cup: 'isr-tel-aviv-rot',
    euro: { cl: ['isr-tel-aviv-rot'], el: ['isr-haifa-gruen', 'isr-tel-aviv-gelb-blau', 'isr-tel-aviv-hatikva'] },
    note: 'Nach 30 Runden Punkte halbiert, dann Meister-, Mittel- und Abstiegsrunde',
  },
  2011: {
    t1: ['isr-kiryat-schmona', 'isr-netanya', 'isr-tel-aviv-rot', 'isr-haifa-gruen', 'isr-sachnin', 'isr-ashdod', 'isr-tel-aviv-hatikva', 'isr-akko', 'isr-tel-aviv-gelb-blau', 'isr-ramat-hascharon', 'isr-jerusalem-gelb-schwarz', 'isr-haifa-rot', 'isr-beer-sheva', 'isr-petach-tikva-blau', 'isr-petach-tikva-rot', 'isr-rischon-lezion'],
    cup: 'isr-tel-aviv-rot',
    euro: { cl: ['isr-haifa-gruen'], el: ['isr-tel-aviv-rot', 'isr-haifa-gruen', 'isr-tel-aviv-hatikva', 'isr-tel-aviv-gelb-blau'] },
    note: 'Nach 30 Runden Punkte halbiert, dann Meister-, Mittel- und Abstiegsrunde',
  },
  2012: {
    t1: ['isr-tel-aviv-gelb-blau', 'isr-haifa-gruen', 'isr-tel-aviv-rot', 'isr-tel-aviv-hatikva', 'isr-kiryat-schmona', 'isr-ramat-hascharon', 'isr-ashdod', 'isr-beer-sheva', 'isr-haifa-rot', 'isr-jerusalem-gelb-schwarz', 'isr-akko', 'isr-sachnin', 'isr-netanya', 'isr-ramat-gan-rot'],
    cup: 'isr-ramat-gan-rot',
    euro: { cl: ['isr-kiryat-schmona'], el: ['isr-tel-aviv-rot', 'isr-tel-aviv-hatikva', 'isr-kiryat-schmona', 'isr-netanya'] },
  },
  2013: {
    t1: ['isr-tel-aviv-gelb-blau', 'isr-beer-sheva', 'isr-kiryat-schmona', 'isr-tel-aviv-rot', 'isr-haifa-gruen', 'isr-sachnin', 'isr-jerusalem-gelb-schwarz', 'isr-ashdod', 'isr-raanana', 'isr-akko', 'isr-haifa-rot', 'isr-ramat-hascharon', 'isr-petach-tikva-blau', 'isr-tel-aviv-hatikva'],
    cup: 'isr-kiryat-schmona',
    euro: { cl: ['isr-tel-aviv-gelb-blau'], el: ['isr-tel-aviv-gelb-blau', 'isr-tel-aviv-rot', 'isr-haifa-gruen', 'isr-ramat-gan-rot'] },
  },
  2014: {
    t1: ['isr-tel-aviv-gelb-blau', 'isr-kiryat-schmona', 'isr-beer-sheva', 'isr-jerusalem-gelb-schwarz', 'isr-petach-tikva-blau', 'isr-raanana', 'isr-sachnin', 'isr-tel-aviv-rot', 'isr-netanya', 'isr-haifa-gruen', 'isr-akko', 'isr-haifa-rot', 'isr-ashdod', 'isr-petach-tikva-rot'],
    cup: 'isr-tel-aviv-gelb-blau',
    euro: { cl: ['isr-tel-aviv-gelb-blau'], el: ['isr-tel-aviv-gelb-blau', 'isr-kiryat-schmona', 'isr-beer-sheva', 'isr-tel-aviv-rot'] },
  },
  2015: {
    t1: ['isr-beer-sheva', 'isr-tel-aviv-gelb-blau', 'isr-jerusalem-gelb-schwarz', 'isr-haifa-gruen', 'isr-sachnin', 'isr-raanana', 'isr-petach-tikva-blau', 'isr-tel-aviv-hatikva', 'isr-tel-aviv-rot', 'isr-kfar-saba', 'isr-kiryat-schmona', 'isr-haifa-rot', 'isr-akko', 'isr-netanya'],
    cup: 'isr-haifa-gruen',
    euro: { cl: ['isr-tel-aviv-gelb-blau'], el: ['isr-beer-sheva', 'isr-jerusalem-gelb-schwarz', 'isr-kiryat-schmona'] },
  },
  2016: {
    t1: ['isr-beer-sheva', 'isr-tel-aviv-gelb-blau', 'isr-jerusalem-gelb-schwarz', 'isr-petach-tikva-blau', 'isr-sachnin', 'isr-haifa-gruen', 'isr-kiryat-schmona', 'isr-tel-aviv-rot', 'isr-haifa-rot', 'isr-ashdod', 'isr-raanana', 'isr-tel-aviv-hatikva', 'isr-aschkelon', 'isr-kfar-saba'],
    cup: 'isr-tel-aviv-hatikva',
    euro: { cl: ['isr-beer-sheva'], el: ['isr-beer-sheva', 'isr-tel-aviv-gelb-blau', 'isr-jerusalem-gelb-schwarz', 'isr-haifa-gruen'] },
  },
  2017: {
    t1: ['isr-beer-sheva', 'isr-tel-aviv-gelb-blau', 'isr-jerusalem-gelb-schwarz', 'isr-haifa-rot', 'isr-netanya', 'isr-tel-aviv-hatikva', 'isr-kiryat-schmona', 'isr-petach-tikva-blau', 'isr-raanana', 'isr-haifa-gruen', 'isr-sachnin', 'isr-ashdod', 'isr-akko', 'isr-aschkelon'],
    cup: 'isr-haifa-rot',
    euro: { cl: ['isr-beer-sheva'], el: ['isr-beer-sheva', 'isr-tel-aviv-gelb-blau', 'isr-jerusalem-gelb-schwarz', 'isr-tel-aviv-hatikva'] },
  },
  2018: {
    t1: ['isr-tel-aviv-gelb-blau', 'isr-haifa-gruen', 'isr-beer-sheva', 'isr-netanya', 'isr-tel-aviv-hatikva', 'isr-hadera', 'isr-jerusalem-gelb-schwarz', 'isr-tel-aviv-rot', 'isr-raanana', 'isr-kiryat-schmona', 'isr-ashdod', 'isr-haifa-rot', 'isr-petach-tikva-blau', 'isr-sachnin'],
    cup: 'isr-tel-aviv-hatikva',
    euro: { cl: ['isr-beer-sheva'], el: ['isr-tel-aviv-gelb-blau', 'isr-beer-sheva', 'isr-jerusalem-gelb-schwarz', 'isr-haifa-rot'] },
  },
  2019: {
    t1: ['isr-tel-aviv-gelb-blau', 'isr-haifa-gruen', 'isr-jerusalem-gelb-schwarz', 'isr-beer-sheva', 'isr-tel-aviv-rot', 'isr-haifa-rot', 'isr-tel-aviv-hatikva', 'isr-ashdod', 'isr-netanya', 'isr-hadera', 'isr-kfar-saba', 'isr-kiryat-schmona', 'isr-nes-ziona', 'isr-raanana'],
    cup: 'isr-beer-sheva',
    euro: { cl: ['isr-tel-aviv-gelb-blau'], el: ['isr-tel-aviv-gelb-blau', 'isr-haifa-gruen', 'isr-beer-sheva', 'isr-tel-aviv-hatikva'] },
  },
  2020: {
    t1: ['isr-haifa-gruen', 'isr-tel-aviv-gelb-blau', 'isr-ashdod', 'isr-beer-sheva', 'isr-petach-tikva-blau', 'isr-kiryat-schmona', 'isr-hadera', 'isr-netanya', 'isr-haifa-rot', 'isr-jerusalem-gelb-schwarz', 'isr-tel-aviv-rot', 'isr-sachnin', 'isr-tel-aviv-hatikva', 'isr-kfar-saba'],
    euro: { cl: ['isr-tel-aviv-gelb-blau'], el: ['isr-haifa-gruen', 'isr-tel-aviv-gelb-blau', 'isr-beer-sheva', 'isr-jerusalem-gelb-schwarz'] },
  },
  2021: {
    t1: ['isr-haifa-gruen', 'isr-beer-sheva', 'isr-tel-aviv-gelb-blau', 'isr-netanya', 'isr-tel-aviv-rot', 'isr-sachnin', 'isr-kiryat-schmona', 'isr-hadera', 'isr-ashdod', 'isr-jerusalem-gelb-schwarz', 'isr-haifa-rot', 'isr-jerusalem-rot', 'isr-nof-hagalil', 'isr-petach-tikva-blau'],
    cup: 'isr-beer-sheva',
    euro: { cl: ['isr-haifa-gruen'], ecl: ['isr-haifa-gruen', 'isr-beer-sheva', 'isr-tel-aviv-gelb-blau', 'isr-ashdod'] },
  },
  2022: {
    t1: ['isr-haifa-gruen', 'isr-beer-sheva', 'isr-tel-aviv-gelb-blau', 'isr-netanya', 'isr-jerusalem-rot', 'isr-ashdod', 'isr-jerusalem-gelb-schwarz', 'isr-haifa-rot', 'isr-tel-aviv-rot', 'isr-sachnin', 'isr-reineh', 'isr-hadera', 'isr-kiryat-schmona', 'isr-nes-ziona'],
    cup: 'isr-jerusalem-gelb-schwarz',
    euro: { cl: ['isr-haifa-gruen'], ecl: ['isr-beer-sheva', 'isr-tel-aviv-gelb-blau', 'isr-netanya'] },
  },
  2023: {
    t1: ['isr-tel-aviv-gelb-blau', 'isr-haifa-gruen', 'isr-beer-sheva', 'isr-haifa-rot', 'isr-sachnin', 'isr-reineh', 'isr-jerusalem-rot', 'isr-jerusalem-gelb-schwarz', 'isr-petach-tikva-blau', 'isr-netanya', 'isr-ashdod', 'isr-hadera', 'isr-tel-aviv-rot', 'isr-petach-tikva-rot'],
    cup: 'isr-petach-tikva-blau',
    euro: { cl: ['isr-haifa-gruen'], el: ['isr-haifa-gruen'], ecl: ['isr-tel-aviv-gelb-blau', 'isr-haifa-gruen', 'isr-beer-sheva', 'isr-jerusalem-gelb-schwarz'] },
  },
  2024: {
    t1: ['isr-tel-aviv-gelb-blau', 'isr-beer-sheva', 'isr-haifa-gruen', 'isr-jerusalem-gelb-schwarz', 'isr-haifa-rot', 'isr-netanya', 'isr-jerusalem-rot', 'isr-reineh', 'isr-sachnin', 'isr-kiryat-schmona', 'isr-ashdod', 'isr-tiberias', 'isr-petach-tikva-blau', 'isr-hadera'],
    cup: 'isr-beer-sheva',
    euro: { cl: ['isr-tel-aviv-gelb-blau'], el: ['isr-tel-aviv-gelb-blau', 'isr-petach-tikva-blau'], ecl: ['isr-beer-sheva', 'isr-haifa-gruen', 'isr-petach-tikva-blau'] },
    note: 'Meister Tel Aviv Gelb-Blau gesetzt (zwei Spiele fehlen im Datensatz)',
  },
  2025: {
    t1: ['isr-tel-aviv-gelb-blau', 'isr-beer-sheva', 'isr-haifa-gruen', 'isr-jerusalem-gelb-schwarz', 'isr-haifa-rot', 'isr-netanya', 'isr-jerusalem-rot', 'isr-reineh', 'isr-sachnin', 'isr-kiryat-schmona', 'isr-ashdod', 'isr-tiberias', 'isr-tel-aviv-rot', 'isr-petach-tikva-rot'],
    euro: { cl: ['isr-tel-aviv-gelb-blau'], el: ['isr-tel-aviv-gelb-blau', 'isr-beer-sheva'], ecl: ['isr-beer-sheva', 'isr-haifa-gruen', 'isr-jerusalem-gelb-schwarz'] },
    note: 'Laufende Saison: Zusammensetzung zu Saisonbeginn (Vorjahresplatz, Aufsteiger hinten)',
  },
};
