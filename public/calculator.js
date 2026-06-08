export const priceLabels = {
  glaspreis: 'Glaspreis',
  statikGlas: 'Statik-Glas',
  montageFenster: 'Montage Fenster',
  montageDaemmung: 'Montage Dämmung',
  montagePanzer: 'Montage Panzer',
  montageBleche: 'Montage Bleche',
  montageHaustuere: 'Montage Haustüre'
};

export const rateLabels = {
  grundrabatt: 'Grundrabatt',
  objektrabatt: 'Objektrabatt',
  verwaltungsbonus: 'Verwaltungsbonus',
  formularbonus: 'Formularbonus',
  gemeinkosten: 'Gemeinkosten',
  gewinn: 'Gewinn'
};

export const inputColumns = [
  { key: 'pos', label: 'Pos', type: 'text', width: 90 },
  { key: 'stk', label: 'Stk', type: 'number', width: 70 },
  { key: 'breite', label: 'Breite mm', type: 'number', width: 105 },
  { key: 'hoehe', label: 'Höhe mm', type: 'number', width: 105 },
  { key: 'beschreibung', label: 'Beschreibung', type: 'text', width: 220 },
  { key: 'grundpreis', label: 'Grundpreis €', type: 'number', width: 120 },
  { key: 'glasIndex', label: 'Glas Index', type: 'number', width: 105 },
  { key: 'ofHolzAlu', label: 'OF Holz-Alu €', type: 'number', width: 120 },
  { key: 'fluegelheber', label: 'Flügelheber €', type: 'number', width: 120 },
  { key: 'beschlaegeSonder', label: 'Beschläge €', type: 'number', width: 120 },
  { key: 'eckpfosten', label: 'Eckpfosten €', type: 'number', width: 120 },
  { key: 'sonderglas', label: 'Sonderglas €', type: 'number', width: 120 },
  { key: 'einstandsprofil', label: 'Einstandsprofil €', type: 'number', width: 140 },
  { key: 'sonstigeZuschlaege', label: 'Sonstige €', type: 'number', width: 120 }
];

export const resultColumns = [
  { key: 'flaeche', label: 'Fläche m²' },
  { key: 'lfmMontage', label: 'Lfm Montage' },
  { key: 'kompriband', label: 'Kompriband' },
  { key: 'apuLeiste', label: 'APU-Leiste' },
  { key: 'fensterbleche', label: 'Fensterbleche' },
  { key: 'glaspreisTotal', label: 'Glaspreis €' },
  { key: 'summeMaterial', label: 'Material €' },
  { key: 'selbstkostenEinzeln', label: 'SK einzeln €' },
  { key: 'selbstkostenGesamt', label: 'SK gesamt €' },
  { key: 'vkEinzel', label: 'VK einzeln €' },
  { key: 'vkGesamt', label: 'VK gesamt €' }
];

export function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value).trim();
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateRow(row = {}, prices = {}, rates = {}) {
  const stk = toNumber(row.stk);
  const breite = toNumber(row.breite);
  const hoehe = toNumber(row.hoehe);
  const flaeche = (breite * hoehe / 1000000) * stk;
  const lfmMontage = ((breite + hoehe) * 2 / 1000) * stk;
  const kompriband = (hoehe * 2 + breite) / 1000;
  const apuLeiste = ((hoehe * 4 + breite) / 1000) * stk;
  const fensterbleche = (breite / 1000) * stk;
  const glaspreisTotal = toNumber(row.glasIndex) * toNumber(prices.glaspreis);
  const summeMaterial = toNumber(row.grundpreis) + glaspreisTotal + toNumber(row.ofHolzAlu) + toNumber(row.fluegelheber) + toNumber(row.beschlaegeSonder) + toNumber(row.eckpfosten) + toNumber(row.sonderglas) + toNumber(row.einstandsprofil) + toNumber(row.sonstigeZuschlaege);
  const rabattFaktor = ((100 - toNumber(rates.grundrabatt)) / 100) * ((100 - toNumber(rates.objektrabatt)) / 100) * ((100 - toNumber(rates.verwaltungsbonus)) / 100) * ((100 - toNumber(rates.formularbonus)) / 100);
  const aufschlagFaktor = ((100 + toNumber(rates.gemeinkosten)) / 100) * ((100 + toNumber(rates.gewinn)) / 100);
  const selbstkostenEinzeln = summeMaterial * rabattFaktor;
  const selbstkostenGesamt = selbstkostenEinzeln * stk;
  const vkEinzel = selbstkostenEinzeln * aufschlagFaktor;
  const vkGesamt = selbstkostenGesamt * aufschlagFaktor;
  return { flaeche, lfmMontage, kompriband, apuLeiste, fensterbleche, glaspreisTotal, summeMaterial, selbstkostenEinzeln, selbstkostenGesamt, vkEinzel, vkGesamt };
}

export function isPositionRow(row = {}) {
  return Boolean(row.pos || row.beschreibung || toNumber(row.stk) || toNumber(row.breite) || toNumber(row.hoehe) || toNumber(row.grundpreis));
}

export function calculateProject(project = {}) {
  const prices = project.prices || {};
  const rates = project.rates || {};
  const rows = (project.rows || []).map((row, index) => ({ ...row, id: row.id || `row-${index + 1}`, calc: calculateRow(row, prices, rates) }));
  const totals = rows.reduce((acc, row) => {
    resultColumns.forEach((column) => { acc[column.key] = (acc[column.key] || 0) + toNumber(row.calc[column.key]); });
    return acc;
  }, {});
  const montage = {
    fenster: toNumber(prices.montageFenster) * toNumber(totals.lfmMontage),
    daemmung: toNumber(prices.montageDaemmung) * toNumber(totals.fensterbleche),
    panzer: toNumber(prices.montagePanzer) * toNumber(totals.flaeche),
    bleche: toNumber(prices.montageBleche) * toNumber(totals.fensterbleche)
  };
  montage.gesamt = montage.fenster + montage.daemmung + montage.panzer + montage.bleche;
  const angebot = { fensterNetto: toNumber(totals.vkGesamt), montageNetto: montage.gesamt };
  angebot.gesamtNetto = angebot.fensterNetto + angebot.montageNetto;
  angebot.mwst = angebot.gesamtNetto * 0.19;
  angebot.gesamtBrutto = angebot.gesamtNetto * 1.19;
  return { rows, totals, montage, angebot, activeRows: rows.filter(isPositionRow).length };
}

export function blankRow() {
  return { pos: '', stk: 1, breite: '', hoehe: '', beschreibung: '', grundpreis: '', glasIndex: '', ofHolzAlu: '', fluegelheber: '', beschlaegeSonder: '', eckpfosten: '', sonderglas: '', einstandsprofil: '', sonstigeZuschlaege: '' };
}

export function formatEuro(value, decimals = 2) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(toNumber(value));
}

export function formatNumber(value, decimals = 2) {
  return new Intl.NumberFormat('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(toNumber(value));
}

export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function toCsv(project, calculation) {
  const lines = [['Pos', 'Beschreibung', 'Stk', 'Breite', 'Höhe', 'VK gesamt'].join(';')];
  calculation.rows.filter(isPositionRow).forEach((row) => lines.push([row.pos, row.beschreibung, row.stk, row.breite, row.hoehe, formatNumber(row.calc.vkGesamt, 2)].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';')));
  lines.push(['', '', '', '', 'Gesamt netto', formatNumber(calculation.angebot.gesamtNetto, 2)].join(';'));
  return lines.join('\n');
}
