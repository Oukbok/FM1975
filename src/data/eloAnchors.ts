// =============================================================================
// WELTRANGLISTE – Stützwerte (Wunsch Pascal). Elo-Punkte je Nation am 1. Juli
// 1975, 1985, 1995, 2005, 2015, 2025 (Saisonstart; linear dazwischen, nach 2025
// gehalten). 0 = Nation bestand an dem Tag nicht → Wert aus der Grundstärke
// (data/nationalTeams.ts) über `eloFromBase`.
// Herkunft: eigene Nachrechnung nach dem Verfahren der World Football Elo
// Ratings aus dem öffentlichen Ergebnisdatensatz aller Länderspiele seit 1872
// (alle Mannschaften starten 1872 bzw. beim ersten Spiel mit 1500, Nachfolger
// übernehmen die Punkte: Tschechien ← Tschechoslowakei, Serbien ← Jugoslawien,
// Russland ← Sowjetunion). Skript `scripts/elo-anchors.mjs`, Quellen und Formel
// in docs/recherche/weltrangliste.md. Die Werte liegen etwas unter denen der
// Originalseite (andere Startwerte), die Reihenfolge stimmt grob überein.
// =============================================================================
import { NATION_BY_CODE, baseStrength, type NationDef } from './nationalTeams';

export const ELO_YEARS = [1975, 1985, 1995, 2005, 2015, 2025] as const;

export const ELO_ANCHORS: Record<string, [number, number, number, number, number, number]> = {
  GER: [1972, 1880, 1960, 1942, 2158, 1992],
  GDR: [1730, 1703, 0, 0, 0, 0],
  ENG: [1855, 1871, 1829, 2000, 1974, 2051],
  SCO: [1762, 1770, 1757, 1629, 1780, 1776],
  WAL: [1595, 1714, 1587, 1583, 1727, 1789],
  NIR: [1675, 1722, 1578, 1495, 1560, 1618],
  IRL: [1528, 1656, 1772, 1870, 1774, 1696],
  NED: [1964, 1774, 1829, 2005, 2053, 2039],
  BEL: [1794, 1738, 1777, 1753, 1940, 1909],
  FRA: [1637, 1906, 1875, 1969, 1970, 2119],
  ESP: [1769, 1759, 1925, 1947, 2010, 2223],
  POR: [1705, 1711, 1816, 1908, 1949, 2085],
  ITA: [1807, 1819, 1940, 1905, 1915, 1948],
  AUT: [1707, 1683, 1660, 1686, 1782, 1904],
  SUI: [1560, 1658, 1788, 1733, 1842, 1914],
  SWE: [1697, 1771, 1829, 1906, 1842, 1821],
  DEN: [1468, 1824, 1908, 1847, 1807, 1927],
  NOR: [1373, 1599, 1857, 1825, 1636, 1921],
  FIN: [1261, 1415, 1584, 1713, 1602, 1616],
  ISL: [1318, 1436, 1578, 1526, 1728, 1612],
  POL: [1895, 1774, 1715, 1809, 1794, 1743],
  HUN: [1662, 1772, 1597, 1639, 1711, 1763],
  TCH: [1762, 1679, 0, 0, 0, 0],
  CZE: [0, 0, 1817, 2002, 1792, 1808],
  SVK: [0, 0, 1537, 1675, 1804, 1725],
  YUG: [1797, 1731, 0, 0, 0, 0],
  SRB: [0, 0, 1632, 1778, 1704, 1905],
  CRO: [0, 0, 1698, 1879, 1884, 1986],
  SVN: [0, 0, 1491, 1651, 1672, 1810],
  BIH: [0, 0, 0, 1630, 1777, 1580],
  MKD: [0, 0, 1519, 1504, 1501, 1697],
  URS: [1716, 1893, 0, 0, 0, 0],
  RUS: [0, 0, 1830, 1764, 1786, 1852],
  UKR: [0, 0, 1517, 1817, 1843, 1866],
  ROU: [1718, 1688, 1880, 1785, 1812, 1744],
  BUL: [1666, 1742, 1862, 1684, 1646, 1512],
  GRE: [1510, 1521, 1601, 1834, 1688, 1900],
  TUR: [1548, 1436, 1712, 1853, 1748, 1897],
  ALB: [1342, 1372, 1373, 1521, 1676, 1685],
  ISR: [1739, 1611, 1560, 1710, 1646, 1687],
  BRA: [1920, 1827, 2051, 2064, 2080, 2080],
  ARG: [1749, 1797, 1857, 2009, 2118, 2208],
  URU: [1653, 1817, 1743, 1824, 1941, 1985],
  CHI: [1648, 1706, 1683, 1702, 2032, 1771],
  COL: [1390, 1574, 1869, 1851, 2056, 2031],
  PER: [1531, 1651, 1531, 1690, 1828, 1825],
  PAR: [1647, 1628, 1665, 1771, 1792, 1905],
  ECU: [1381, 1446, 1635, 1776, 1870, 1993],
  MEX: [1705, 1792, 1851, 1978, 1912, 1943],
  USA: [1368, 1510, 1670, 1922, 1926, 1825],
  CAN: [1438, 1628, 1569, 1635, 1604, 1884],
  CRC: [1595, 1570, 1648, 1740, 1906, 1821],
  NGA: [1669, 1676, 1802, 1812, 1741, 1692],
  CMR: [1541, 1676, 1595, 1831, 1731, 1703],
  GHA: [1667, 1715, 1702, 1635, 1765, 1600],
  CIV: [1562, 1627, 1709, 1790, 1827, 1711],
  SEN: [1536, 1637, 1526, 1754, 1766, 1899],
  MAR: [1687, 1698, 1641, 1791, 1620, 1912],
  ALG: [1586, 1731, 1683, 1533, 1769, 1814],
  TUN: [1670, 1679, 1603, 1779, 1706, 1733],
  EGY: [1750, 1668, 1719, 1784, 1736, 1779],
  RSA: [0, 0, 1615, 1657, 1662, 1677],
  JPN: [1525, 1685, 1663, 1882, 1839, 1964],
  KOR: [1612, 1692, 1691, 1783, 1839, 1887],
  IRN: [1703, 1737, 1652, 1909, 1823, 1913],
  KSA: [1554, 1655, 1641, 1722, 1601, 1691],
  QAT: [1362, 1592, 1545, 1615, 1631, 1650],
  CHN: [1711, 1673, 1647, 1693, 1695, 1524],
  AUS: [1665, 1662, 1761, 1860, 1820, 1890],
  NZL: [1515, 1707, 1636, 1737, 1690, 1808],
};

/** Grundstärke → Elo (Ausgleichsgerade über alle Stützwerte: 383 Paare, mittlere Abweichung ≈ 90 Punkte). */
export const eloFromBase = (base: number) => 450 + 17.8 * base;

/** Richtwert der Elo-Punkte einer Nation im Jahr (Bruchteile erlaubt, z. B. 1978.5). */
export function eloTarget(n: NationDef | string, year: number): number {
  const def = typeof n === 'string' ? NATION_BY_CODE[n] : n;
  if (!def) return 1500;
  const a = ELO_ANCHORS[def.code];
  const fromBase = eloFromBase(baseStrength(def, Math.floor(year)));
  if (!a) return fromBase;
  const t = Math.max(0, Math.min(5, (year - 1975) / 10));
  const i = Math.min(4, Math.floor(t));
  const lo = a[i] || null, hi = a[i + 1] || null;
  if (lo != null && hi != null) return lo + (hi - lo) * (t - i);
  // Lücke (Nation entsteht/vergeht im Jahrzehnt): vorhandenen Stützwert mit der Grundstärke mischen.
  const known = lo ?? hi;
  return known != null ? (known + fromBase) / 2 : fromBase;
}
