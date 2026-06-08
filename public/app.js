import { sampleProject, emptyProject } from './sample-data.js';
import {
  inputColumns,
  resultColumns,
  priceLabels,
  rateLabels,
  blankRow,
  calculateProject,
  formatEuro,
  formatNumber,
  downloadText,
  toCsv,
  isPositionRow
} from './calculator.js';

const STORE_KEY = 'merz_fenster_kalkulation_v2';
const app = document.querySelector('#app');
let activeTab = 'kalkulation';
let project = loadProject();
let calculation = calculateProject(project);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadProject() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) return normalizeProject(JSON.parse(saved));
  } catch {
    localStorage.removeItem(STORE_KEY);
  }
  return normalizeProject(clone(sampleProject));
}

function normalizeProject(value) {
  return {
    ...clone(emptyProject),
    ...value,
    meta: { ...(emptyProject.meta || {}), ...(value?.meta || {}) },
    prices: { ...(emptyProject.prices || {}), ...(value?.prices || {}) },
    rates: { ...(emptyProject.rates || {}), ...(value?.rates || {}) },
    rows: Array.isArray(value?.rows) && value.rows.length ? value.rows : [blankRow(), blankRow(), blankRow()]
  };
}

function saveProject() {
  localStorage.setItem(STORE_KEY, JSON.stringify(project));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fieldValue(value) {
  return value === null || value === undefined ? '' : String(value);
}

function numberOrText(input) {
  if (input.type === 'number') return input.value === '' ? '' : Number(input.value);
  return input.value;
}

function setByPath(path, value) {
  const [group, key] = path.split('.');
  project[group] = { ...(project[group] || {}), [key]: value };
}

function setRow(index, key, value) {
  project.rows[index] = { ...(project.rows[index] || blankRow()), [key]: value };
}

function recalc() {
  calculation = calculateProject(project);
  saveProject();
}

function renderCalcValue(key, value) {
  const lower = key.toLowerCase();
  if (lower.includes('gesamt') || lower.includes('kosten') || lower.includes('vk') || lower.includes('preis') || lower.includes('material')) {
    return `<span class="money">${formatEuro(value, 2)}</span>`;
  }
  return formatNumber(value, 3);
}

function render() {
  recalc();
  app.innerHTML = `
    <div class="shell">
      <header class="hero">
        <div class="brand-row">
          <div class="brand-logo-panel"><img src="./assets/merz-logo.svg" alt="Schreinerei Merz" /></div>
          <div class="brand-copy">
            <p class="eyebrow">Schreinerei Merz · Raisting</p>
            <h1>Fenster Kalkulation</h1>
            <p class="hero-subline">Excel-Logik als Desktop-App für Fenster, Montage und Nebenkosten.</p>
            <div class="hero-tags"><span>Fenster</span><span>Beschattung</span><span>Haustüren</span><span>Montage</span></div>
          </div>
        </div>
        <div class="hero-actions">
          <button class="ghost" data-action="load-sample">Emler Demo laden</button>
          <button class="ghost" data-action="new-project">Leere Vorlage</button>
          <button class="primary" data-action="add-row">+ Position</button>
        </div>
      </header>

      <section class="kpi-grid">
        ${kpiCard('Fenster netto', 'fensterNetto', calculation.angebot.fensterNetto, 'Aus VK gesamt der Positionen')}
        ${kpiCard('Montage netto', 'montageNetto', calculation.angebot.montageNetto, 'Fenster, Panzer, Bleche, Dämmung')}
        ${kpiCard('Gesamt netto', 'gesamtNetto', calculation.angebot.gesamtNetto, 'Fenster + Montage', 'strong')}
        ${kpiCard('Gesamt brutto', 'gesamtBrutto', calculation.angebot.gesamtBrutto, 'inkl. 19% MwSt')}
      </section>

      <main class="layout">
        <aside class="side-panel">
          ${renderProjectMeta()}
          ${renderSettings('Preise & Montage-Sätze', 'prices', priceLabels, '€')}
          ${renderSettings('Rabatte & Aufschläge', 'rates', rateLabels, '%')}
        </aside>
        <section class="workspace">
          <nav class="tabs">
            ${tab('kalkulation', 'Kalkulation')}
            ${tab('angebot', 'Angebot')}
            ${tab('formeln', 'Formeln')}
          </nav>
          <div class="tab-panel">
            ${activeTab === 'kalkulation' ? renderTable() : ''}
            ${activeTab === 'angebot' ? renderOffer() : ''}
            ${activeTab === 'formeln' ? renderFormulas() : ''}
          </div>
        </section>
      </main>
    </div>`;
}

function kpiCard(label, key, value, hint, variant = '') {
  return `<article class="kpi ${variant}"><span>${escapeHtml(label)}</span><strong data-kpi="${key}">${formatEuro(value, 2)}</strong><small>${escapeHtml(hint)}</small></article>`;
}

function tab(id, label) {
  return `<button class="tab ${activeTab === id ? 'active' : ''}" data-tab="${id}">${escapeHtml(label)}</button>`;
}

function renderProjectMeta() {
  const meta = project.meta || {};
  return `<section class="card"><div class="card-title"><h2>Projekt</h2><span data-active-rows>${calculation.activeRows} aktive Positionen</span></div>
    ${textField('Kunde', 'meta.kunde', meta.kunde)}
    <div class="two">${textField('Objektnummer', 'meta.objektnummer', meta.objektnummer)}${textField('Datum', 'meta.datum', meta.datum, 'date')}</div>
    ${textField('Sachbearbeiter', 'meta.sachbearbeiter', meta.sachbearbeiter)}
    <div class="two">${textField('Art der Arbeit', 'meta.artDerArbeit', meta.artDerArbeit)}${textField('Fenstertyp', 'meta.fenstertyp', meta.fenstertyp)}</div>
  </section>`;
}

function textField(label, path, value, type = 'text') {
  return `<label>${escapeHtml(label)}<input data-path="${path}" type="${type}" value="${escapeHtml(fieldValue(value))}" /></label>`;
}

function renderSettings(title, group, labels, suffix) {
  return `<section class="card compact-card"><div class="card-title"><h2>${escapeHtml(title)}</h2><span>${escapeHtml(suffix)}</span></div>
    <div class="settings-list">${Object.entries(labels).map(([key, label]) => `
      <label class="inline-field"><span>${escapeHtml(label)}</span><div class="number-with-unit"><input data-path="${group}.${key}" type="number" step="0.01" value="${escapeHtml(fieldValue(project[group]?.[key]))}" /><b>${escapeHtml(suffix)}</b></div></label>
    `).join('')}</div>
  </section>`;
}

function renderTable() {
  return `<section class="sheet-card"><div class="sheet-toolbar"><div><p class="eyebrow">Live-Kalkulation</p><h2>Positionen</h2></div><div class="toolbar-actions"><button class="ghost" data-action="export-json">Projekt JSON</button><button class="ghost" data-action="import-json">JSON importieren</button><button class="ghost" data-action="export-csv">Angebot CSV</button><button class="primary" data-action="add-row">+ Position</button><input class="hidden" id="jsonImport" type="file" accept="application/json" /></div></div>
    <div class="table-wrap"><table class="calc-table"><thead><tr><th class="sticky-col action-col">#</th>${inputColumns.map(c => `<th style="min-width:${c.width}px">${escapeHtml(c.label)}</th>`).join('')}${resultColumns.map(c => `<th class="result-head">${escapeHtml(c.label)}</th>`).join('')}</tr></thead><tbody>${project.rows.map((row, index) => renderRow(row, calculation.rows[index]?.calc || {}, index)).join('')}</tbody><tfoot>${renderTotals()}</tfoot></table></div>
  </section>`;
}

function renderRow(row, calc, index) {
  return `<tr class="${isPositionRow(row) ? '' : 'soft-row'}"><td class="sticky-col action-col row-actions"><button title="Duplizieren" data-action="duplicate-row" data-row="${index}">⧉</button><button title="Löschen" data-action="delete-row" data-row="${index}">×</button></td>${inputColumns.map(column => `<td><input data-row="${index}" data-key="${column.key}" type="${column.type || 'text'}" step="0.01" value="${escapeHtml(fieldValue(row[column.key]))}" /></td>`).join('')}${resultColumns.map(column => `<td class="result-cell ${column.key === 'vkGesamt' ? 'final-cell' : ''}" data-result-row="${index}" data-result-key="${column.key}">${renderCalcValue(column.key, calc[column.key])}</td>`).join('')}</tr>`;
}

function renderTotals() {
  return `<tr><th class="sticky-col action-col">SUMME</th><th colspan="${inputColumns.length}"></th>${resultColumns.map(column => `<th class="result-total ${column.key === 'vkGesamt' ? 'final-cell' : ''}" data-total-key="${column.key}">${renderCalcValue(column.key, calculation.totals[column.key] || 0)}</th>`).join('')}</tr>`;
}

function renderOffer() {
  const activeRows = calculation.rows.filter(isPositionRow);
  return `<section class="sheet-card offer-card"><div class="offer-head"><div class="offer-brand"><img src="./assets/merz-logo.svg" alt="Schreinerei Merz" /><div><p class="eyebrow">Angebot</p><h2>Zusammenfassung</h2></div></div><button class="primary" data-action="print-offer">Drucken / PDF</button></div>
    <div class="offer-meta"><div><span>Kunde</span><strong data-offer-meta="kunde">${escapeHtml(fieldValue(project.meta?.kunde) || '-')}</strong></div><div><span>Objektnummer</span><strong data-offer-meta="objektnummer">${escapeHtml(fieldValue(project.meta?.objektnummer) || '-')}</strong></div><div><span>Sachbearbeiter</span><strong data-offer-meta="sachbearbeiter">${escapeHtml(fieldValue(project.meta?.sachbearbeiter) || '-')}</strong></div><div><span>Datum</span><strong data-offer-meta="datum">${escapeHtml(fieldValue(project.meta?.datum) || '-')}</strong></div></div>
    <div class="table-wrap slim"><table class="offer-table"><thead><tr><th>Pos</th><th>Beschreibung</th><th>Stk</th><th>Breite</th><th>Höhe</th><th>VK gesamt</th></tr></thead><tbody>${activeRows.map(row => `<tr><td>${escapeHtml(fieldValue(row.pos))}</td><td>${escapeHtml(fieldValue(row.beschreibung))}</td><td>${escapeHtml(fieldValue(row.stk))}</td><td>${escapeHtml(fieldValue(row.breite))}</td><td>${escapeHtml(fieldValue(row.hoehe))}</td><td>${formatEuro(row.calc.vkGesamt, 2)}</td></tr>`).join('')}</tbody></table></div>
    <div class="offer-sums">${sumLine('Summe Fenster netto', 'fensterNetto', calculation.angebot.fensterNetto)}${sumLine('Montage & Nebenkosten netto', 'montageNetto', calculation.angebot.montageNetto)}${sumLine('GESAMT netto', 'gesamtNetto', calculation.angebot.gesamtNetto, true)}${sumLine('zzgl. 19% MwSt', 'mwst', calculation.angebot.mwst)}${sumLine('GESAMT brutto', 'gesamtBrutto', calculation.angebot.gesamtBrutto, true)}</div>
  </section>`;
}

function sumLine(label, key, value, strong = false) {
  return `<div class="${strong ? 'sum-strong' : ''}"><span>${escapeHtml(label)}</span><strong data-offer-sum="${key}">${formatEuro(value, 2)}</strong></div>`;
}

function renderFormulas() {
  return `<section class="sheet-card formula-card"><div class="sheet-toolbar"><div><p class="eyebrow">Aus der Excel-Vorlage nachgebaut</p><h2>Formellogik</h2></div></div><div class="formula-grid"><article><strong>Fläche</strong><span>(Breite × Höhe / 1.000.000) × Stück</span></article><article><strong>Lfm Montage</strong><span>((Breite + Höhe) × 2 / 1.000) × Stück</span></article><article><strong>VK gesamt</strong><span>Selbstkosten gesamt × Gemeinkosten × Gewinn</span></article><article><strong>Montage gesamt</strong><span>Fenster-Montage + Panzer + Bleche + Dämmung</span></article></div></section>`;
}

function updateFromControl(target) {
  if (target.matches('[data-path]')) {
    setByPath(target.dataset.path, numberOrText(target));
    return true;
  }
  if (target.matches('[data-row][data-key]')) {
    setRow(Number(target.dataset.row), target.dataset.key, numberOrText(target));
    return true;
  }
  return false;
}

function refreshOutputs() {
  recalc();
  const kpiMap = { fensterNetto: calculation.angebot.fensterNetto, montageNetto: calculation.angebot.montageNetto, gesamtNetto: calculation.angebot.gesamtNetto, gesamtBrutto: calculation.angebot.gesamtBrutto };
  Object.entries(kpiMap).forEach(([key, value]) => document.querySelectorAll(`[data-kpi="${key}"]`).forEach(node => node.textContent = formatEuro(value, 2)));
  document.querySelectorAll('[data-active-rows]').forEach(node => node.textContent = `${calculation.activeRows} aktive Positionen`);
  document.querySelectorAll('[data-result-row][data-result-key]').forEach(node => {
    const row = calculation.rows[Number(node.dataset.resultRow)];
    if (row) node.innerHTML = renderCalcValue(node.dataset.resultKey, row.calc[node.dataset.resultKey]);
  });
  document.querySelectorAll('[data-total-key]').forEach(node => node.innerHTML = renderCalcValue(node.dataset.totalKey, calculation.totals[node.dataset.totalKey] || 0));
  document.querySelectorAll('[data-offer-sum]').forEach(node => node.textContent = formatEuro(calculation.angebot[node.dataset.offerSum] || 0, 2));
  document.querySelectorAll('[data-offer-meta]').forEach(node => node.textContent = fieldValue(project.meta?.[node.dataset.offerMeta]) || '-');
}

app.addEventListener('input', event => {
  if (updateFromControl(event.target)) refreshOutputs();
});

app.addEventListener('change', event => {
  const target = event.target;
  if (target.id === 'jsonImport' && target.files?.[0]) {
    const reader = new FileReader();
    reader.onload = () => {
      try { project = normalizeProject(JSON.parse(reader.result)); render(); }
      catch { alert('Die JSON-Datei konnte nicht gelesen werden.'); }
    };
    reader.readAsText(target.files[0]);
    return;
  }
  if (updateFromControl(target)) refreshOutputs();
});

app.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.tab) { activeTab = button.dataset.tab; render(); return; }
  const action = button.dataset.action;
  const rowIndex = button.dataset.row !== undefined ? Number(button.dataset.row) : null;
  if (action === 'add-row') { project.rows.push(blankRow()); render(); }
  if (action === 'delete-row' && rowIndex !== null) { project.rows.splice(rowIndex, 1); render(); }
  if (action === 'duplicate-row' && rowIndex !== null) { project.rows.splice(rowIndex + 1, 0, { ...project.rows[rowIndex] }); render(); }
  if (action === 'load-sample') { project = normalizeProject(clone(sampleProject)); render(); }
  if (action === 'new-project') { project = normalizeProject(clone(emptyProject)); project.rows = Array.from({ length: 10 }, () => blankRow()); render(); }
  if (action === 'export-json') downloadText('fenster-kalkulation-projekt.json', JSON.stringify(project, null, 2), 'application/json');
  if (action === 'import-json') document.querySelector('#jsonImport')?.click();
  if (action === 'export-csv') downloadText('angebot-zusammenfassung.csv', toCsv(project, calculation), 'text/csv');
  if (action === 'print-offer') window.print();
});

render();
