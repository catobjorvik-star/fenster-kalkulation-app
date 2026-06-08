import { sampleProject, emptyProject } from './sample-data.js';
import { inputColumns, resultColumns, priceLabels, rateLabels, blankRow, calculateProject, formatEuro, formatNumber, downloadText, toCsv } from './calculator.js';

const STORE_KEY = 'merz_fenster_kalkulation_v1';
let state = loadProject();

function loadProject() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(sampleProject);
  } catch {
    return structuredClone(sampleProject);
  }
}

function saveProject() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function setPath(path, value) {
  const [group, key] = path.split('.');
  state[group][key] = value;
  render();
}

function setRow(index, key, value) {
  state.rows[index][key] = value;
  render();
}

function addRow() {
  state.rows.push({ ...blankRow(), id: crypto.randomUUID?.() || String(Date.now()) });
  render();
}

function duplicateRow(index) {
  state.rows.splice(index + 1, 0, { ...state.rows[index], id: crypto.randomUUID?.() || String(Date.now()), pos: `${state.rows[index].pos || ''} Kopie` });
  render();
}

function deleteRow(index) {
  state.rows.splice(index, 1);
  render();
}

function resetSample() {
  state = structuredClone(sampleProject);
  render();
}

function newProject() {
  state = structuredClone(emptyProject);
  state.rows = [{ ...blankRow(), id: 'row-1' }];
  render();
}

function exportJson() {
  downloadText(`fenster-kalkulation-${Date.now()}.json`, JSON.stringify(state, null, 2), 'application/json');
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON');
      state = { ...structuredClone(emptyProject), ...parsed };
      render();
    } catch (error) {
      alert('JSON konnte nicht gelesen werden.');
    }
  };
  reader.readAsText(file);
}

function field(label, value, path, type = 'text') {
  return `<label><span>${label}</span><input type="${type}" value="${value ?? ''}" data-path="${path}"></label>`;
}

function render() {
  saveProject();
  const calculation = calculateProject(state);
  document.querySelector('#app').innerHTML = `
    <main class="shell">
      <header class="app-header">
        <div class="brand-zone">
          <img class="brand-logo" src="./assets/merz-logo.svg" alt="Schreinerei Merz">
          <div class="brand-copy">
            <p class="eyebrow">Fenster · Montage · Angebot</p>
            <h1>Fenster Kalkulation</h1>
            <p class="description">Excel-Logik als schnelle Desktop-Web-App für Projekte, Positionen, Montagekosten und Angebotssummen.</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="ghost" data-action="new">Neue Kalkulation</button>
          <button class="ghost" data-action="sample">Emler laden</button>
          <button class="primary" data-action="print">Angebot drucken</button>
        </div>
      </header>

      <section class="kpis">
        ${kpi('Gesamt netto', formatEuro(calculation.angebot.gesamtNetto), 'Referenz Angebot')}
        ${kpi('Fenster netto', formatEuro(calculation.angebot.fensterNetto), `${calculation.activeRows} Positionen`)}
        ${kpi('Montage netto', formatEuro(calculation.angebot.montageNetto), 'Fenster, Panzer, Bleche')}
        ${kpi('Gesamt brutto', formatEuro(calculation.angebot.gesamtBrutto), 'inkl. 19% MwSt')}
      </section>

      <section class="workspace">
        <aside class="side">
          <div class="panel">
            <h2>Projekt</h2>
            ${field('Kunde', state.meta.kunde, 'meta.kunde')}
            ${field('Objektnummer', state.meta.objektnummer, 'meta.objektnummer')}
            ${field('Sachbearbeiter', state.meta.sachbearbeiter, 'meta.sachbearbeiter')}
            ${field('Datum', state.meta.datum, 'meta.datum', 'date')}
            ${field('Art der Arbeit', state.meta.artDerArbeit, 'meta.artDerArbeit')}
            ${field('Fenstertyp', state.meta.fenstertyp, 'meta.fenstertyp')}
          </div>
          <div class="panel">
            <h2>Preise</h2>
            ${Object.entries(priceLabels).map(([key, label]) => field(label, state.prices[key], `prices.${key}`, 'number')).join('')}
          </div>
          <div class="panel">
            <h2>Rabatte / Zuschläge</h2>
            ${Object.entries(rateLabels).map(([key, label]) => field(`${label} %`, state.rates[key], `rates.${key}`, 'number')).join('')}
          </div>
          <div class="panel tools">
            <button class="primary" data-action="export-json">JSON exportieren</button>
            <label class="file-button">JSON importieren<input type="file" accept="application/json" data-action="import-json"></label>
            <button class="ghost" data-action="export-csv">CSV exportieren</button>
          </div>
        </aside>

        <section class="sheet">
          <div class="sheet-head">
            <div><h2>Positionskalkulation</h2><p>Breite/Höhe, Materialkosten und Zuschläge direkt wie in der Excel-Logik pflegen.</p></div>
            <button class="primary" data-action="add-row">Position hinzufügen</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>${inputColumns.map(col => `<th style="min-width:${col.width}px">${col.label}</th>`).join('')}${resultColumns.map(col => `<th>${col.label}</th>`).join('')}<th>Aktion</th></tr></thead>
              <tbody>${calculation.rows.map((row, index) => rowTemplate(row, index)).join('')}</tbody>
            </table>
          </div>
        </section>
      </section>

      <section class="offer" id="offer">
        <div class="offer-brand"><img src="./assets/merz-logo.svg" alt="Schreinerei Merz"><div><h2>Angebot Zusammenfassung</h2><p>${state.meta.kunde || 'Kunde'} · ${state.meta.objektnummer || 'Projekt'}</p></div></div>
        <div class="offer-grid">
          ${summary('Fenster netto', calculation.angebot.fensterNetto)}
          ${summary('Montage netto', calculation.angebot.montageNetto)}
          ${summary('Gesamt netto', calculation.angebot.gesamtNetto)}
          ${summary('MwSt 19%', calculation.angebot.mwst)}
          ${summary('Gesamt brutto', calculation.angebot.gesamtBrutto, true)}
        </div>
      </section>
    </main>`;

  bindEvents(calculation);
}

function kpi(label, value, note) {
  return `<article class="kpi"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
}

function summary(label, value, strong = false) {
  return `<div class="summary ${strong ? 'strong' : ''}"><span>${label}</span><strong>${formatEuro(value)}</strong></div>`;
}

function rowTemplate(row, index) {
  const inputs = inputColumns.map((col) => `<td><input type="${col.type}" value="${row[col.key] ?? ''}" data-row="${index}" data-key="${col.key}"></td>`).join('');
  const results = resultColumns.map((col) => `<td class="result">${col.key.includes('Euro') || col.key.includes('preis') || col.key.includes('summe') || col.key.includes('kosten') || col.key.includes('vk') ? formatEuro(row.calc[col.key]) : formatNumber(row.calc[col.key])}</td>`).join('');
  return `<tr>${inputs}${results}<td class="actions"><button data-dup="${index}">Kopie</button><button data-del="${index}">Löschen</button></td></tr>`;
}

function bindEvents(calculation) {
  document.querySelectorAll('[data-path]').forEach((input) => input.addEventListener('input', (event) => setPath(event.target.dataset.path, event.target.value)));
  document.querySelectorAll('[data-row]').forEach((input) => input.addEventListener('input', (event) => setRow(Number(event.target.dataset.row), event.target.dataset.key, event.target.value)));
  document.querySelectorAll('[data-dup]').forEach((button) => button.addEventListener('click', () => duplicateRow(Number(button.dataset.dup))));
  document.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', () => deleteRow(Number(button.dataset.del))));
  document.querySelector('[data-action="add-row"]').addEventListener('click', addRow);
  document.querySelector('[data-action="new"]').addEventListener('click', newProject);
  document.querySelector('[data-action="sample"]').addEventListener('click', resetSample);
  document.querySelector('[data-action="print"]').addEventListener('click', () => window.print());
  document.querySelector('[data-action="export-json"]').addEventListener('click', exportJson);
  document.querySelector('[data-action="export-csv"]').addEventListener('click', () => downloadText('angebot.csv', toCsv(state, calculation), 'text/csv'));
  document.querySelector('[data-action="import-json"]').addEventListener('change', (event) => importJson(event.target.files[0]));
}

render();
