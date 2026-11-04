// =============================================================================
// SPONSORING 2.0 — fiktive, epochentypische Firmen je Branche und Herkunftsland.
// Bewusst keine echten Marken und keine fast-echten Namen (Prüfung: npm run test:names,
// Umbenennung alter Spielstände: data/sponsorRenames.ts). `from`/`to` = Jahre des Auftritts.
// =============================================================================
import type { SponsorIndustry } from '../types/sponsor';

export interface SponsorFirm { name: string; country: string; from?: number; to?: number }

const F = (name: string, country = 'DE', from?: number, to?: number): SponsorFirm => ({ name, country, from, to });

export const SPONSOR_FIRMS: Record<SponsorIndustry, SponsorFirm[]> = {
  spirituosen: [F('Falkenhorst Kräuterlikör'), F('Heidekrug Korn'), F('Lotsenbitter'), F('Doppelkorn Brakelmann'), F('Amaro Ventoso', 'IT'), F('Weinbrand Goldhügel')],
  brauerei: [F('Kesselberg Bräu'), F('Rheinperle Pils'), F('Brauerei Sonnwiese'), F('Kogge Bräu'), F('Abtei Hohenwald'), F('Steinbock Bräu'), F('Lindenhof Export'), F('Polder Bier', 'NL')],
  tabak: [F('Kompass Zigaretten'), F('Kommodore Tabak'), F('Silberstreif Filter'), F('Pfeifenhaus Nordtabak')],
  versicherung: [F('Deichland Versicherung'), F('Kontor Leben'), F('Ankerhof Assekuranz'), F('Domblick Versicherungen'), F('Gotthard Rück', 'CH'), F('Mutuelle Clairval', 'FR'), F('Thamesgate Insurance', 'GB')],
  bank: [F('Kontorbank Nord'), F('Heimatkasse'), F('Rheintaler Kreditbank'), F('Brunnenthal Sparbank'), F('Säntis Privatbank', 'CH'), F('Marmara Kredi', 'TR'), F('Pearl Gulf Bank', 'QA'), F('Grachten Bank', 'NL')],
  auto: [F('Merlin Automobile'), F('Kronwagen'), F('Ruhrwagen'), F('Lohwald Autohäuser'), F('Turino Motori', 'IT'), F('Lumière Automobiles', 'FR'), F('Hayashi Motors', 'JP'), F('Hanmoo Motors', 'KR'), F('Tianhe Motors', 'CN', 2015)],
  elektronik: [F('Hansa Elektro'), F('Wellenwerk Radio'), F('Nordklang Phono'), F('Kaiyo Denki', 'JP', 1978), F('Shinrai Electronics', 'JP', 1978), F('Asahina Audio', 'JP', 1978), F('Atlas Computers', 'US', 1980, 1995), F('Corvid Micro', 'US', 1982, 2000), F('Polderlicht', 'NL'), F('Hanbit Electronics', 'KR', 1995), F('Jinxiu Electronics', 'CN', 2012)],
  handel: [F('Marktkorb'), F('Kaufkontor'), F('Möbel Wohnwerk'), F('Baumarkt Hammerschmidt'), F('Elektro-Discount Blitz', 'DE', 1990), F('Pazar Lale', 'TR')],
  bau: [F('Ruhr-Bau'), F('Domstadt Immobilien'), F('Weserbau Lohmann'), F('Sahil Construction', 'AE')],
  chemie: [F('Greifen Chemie'), F('Siegtal Metallwerke'), F('Emscher Kohle', 'DE', 1975, 2005), F('Elbgummi Werke')],
  lebensmittel: [F('Sonnen Molkerei'), F('Weltmarke Kaffee'), F('Kutterfang Fisch'), F('Schoko Bodenhain'), F('Pasta Fiorentina', 'IT'), F('Bergwiesen Milch', 'CH'), F('Prairie Cola', 'US')],
  pharma: [F('Rhein-Pharma'), F('Medivalis'), F('Alpenapotheke Pharma', 'CH')],
  sportartikel: [F('Gepard Sport'), F('Nordstern Sportswear'), F('Herzog Sport'), F('Linea Atletica', 'IT'), F('Vantor Athletics', 'US', 1985), F('Étoile Sport', 'FR')],
  logistik: [F('Paketblitz', 'DE', 1990), F('Hanse Logistik'), F('Kurierwind Express'), F('Speedline Cargo', 'NL')],
  telekom: [F('Telenova', 'DE', 1992), F('Funknetz Plus', 'DE', 1992), F('Mobiwell', 'DE', 1996), F('Kabelwelt', 'DE', 1996), F('Hanbit Mobile', 'KR', 2000), F('Jinxiu Mobile', 'CN', 2012)],
  energie: [F('Rheinstrom', 'DE', 1998), F('Lumen Energie', 'DE', 1998), F('Küstengas', 'DE', 1998), F('Stadtwerke Plus', 'DE', 1998), F('Taiga Gas Export', 'RU', 2006, 2021), F('Pearl Energy', 'QA', 2011), F('Desert Petroleum', 'SA', 2023)],
  tech: [F('Netzwerk AG', 'DE', 1998), F('Datawerk', 'DE', 2000), F('Cloudhaven', 'US', 2008), F('Bytestream', 'US', 2010), F('Yunhai Tech', 'CN', 2012), F('Kaiyo Digital', 'JP', 2010), F('Hanbit Cloud', 'KR', 2012)],
  online: [F('Klickhaus.de', 'DE', 1999), F('Fanbox24', 'DE', 2005), F('Modeplatz', 'DE', 2010), F('Shopwelt', 'US', 2008), F('Jade Mall', 'CN', 2014), F('Bitmarkt Online', 'NL', 2008)],
  airline: [F('Möwe Charter', 'DE', 2000), F('Alpenflug', 'DE', 2000), F('Al-Sahra Airways', 'AE', 2004), F('Gulf Crown Air', 'AE', 2004), F('Doha Pearl Airways', 'QA', 2011), F('Lale Air', 'TR', 2005), F('Desert Wings', 'SA', 2023)],
  staatsfonds: [F('Doha Horizons', 'QA', 2011), F('Pearl Investment Authority', 'QA', 2011), F('Discover Liwa', 'AE', 2011), F('Desert Vision Fund', 'SA', 2023), F('Invest Rheinland', 'DE', 2011)],
  wetten: [F('Torwette', 'DE', 2005), F('Bet-Arena', 'MT', 2005), F('Valletta Bet', 'MT', 2005), F('Quotenkönig', 'DE', 2012), F('Royal Odds', 'GB', 2012)],
  krypto: [F('Coinkeller', 'US', 2021), F('BitArena', 'MT', 2021), F('Blockwerft', 'US', 2021), F('FanToken Hub', 'MT', 2021)],
};

/** Alle Firmen als flache Liste (Prüfungen, Bilderliste). */
export const ALL_SPONSOR_FIRMS: { name: string; industry: SponsorIndustry; country: string; from?: number; to?: number }[] =
  (Object.keys(SPONSOR_FIRMS) as SponsorIndustry[]).flatMap((industry) => SPONSOR_FIRMS[industry].map((f) => ({ ...f, industry })));
