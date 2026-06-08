export const sampleProject = {
  meta: {
    kunde: 'Emler Haus A',
    objektnummer: '260284',
    sachbearbeiter: 'KJ/CAB',
    datum: '2026-06-08',
    artDerArbeit: 'Fenster',
    fenstertyp: 'Holz-Alu'
  },
  prices: {
    glaspreis: 56,
    statikGlas: 48,
    montageFenster: 0,
    montageDaemmung: 0,
    montagePanzer: 0,
    montageBleche: 0,
    montageHaustuere: 60
  },
  rates: {
    grundrabatt: 0,
    objektrabatt: 0,
    verwaltungsbonus: 0,
    formularbonus: 0,
    gemeinkosten: 0,
    gewinn: 0
  },
  rows: [
    { id: 'r1', pos: '1.01', stk: 1, breite: 730, hoehe: 1910, beschreibung: 'FE Fest', grundpreis: 7200, glasIndex: 1.16, ofHolzAlu: 2200, fluegelheber: 0, beschlaegeSonder: 0, eckpfosten: 0, sonderglas: 0, einstandsprofil: 0, sonstigeZuschlaege: 150 },
    { id: 'r2', pos: '1.02', stk: 1, breite: 1730, hoehe: 1910, beschreibung: 'FE Fest groß', grundpreis: 11200, glasIndex: 3.03, ofHolzAlu: 2700, fluegelheber: 0, beschlaegeSonder: 0, eckpfosten: 0, sonderglas: 0, einstandsprofil: 0, sonstigeZuschlaege: 150 },
    { id: 'r3', pos: '1.06', stk: 2, breite: 2855, hoehe: 2465, beschreibung: 'HST +80', grundpreis: 11800, glasIndex: 5.71, ofHolzAlu: 3800, fluegelheber: 0, beschlaegeSonder: 0, eckpfosten: 0, sonderglas: 0, einstandsprofil: 125.62, sonstigeZuschlaege: 560 },
    { id: 'r4', pos: '1.08', stk: 1, breite: 2855, hoehe: 2445, beschreibung: 'FE Fest +100', grundpreis: 5585.0678651734, glasIndex: 6.27, ofHolzAlu: 127, fluegelheber: 0, beschlaegeSonder: 0, eckpfosten: 0, sonderglas: 300.96, einstandsprofil: 134.185, sonstigeZuschlaege: 150 }
  ]
};

export const emptyProject = {
  meta: { kunde: '', objektnummer: '', sachbearbeiter: '', datum: '', artDerArbeit: 'Fenster', fenstertyp: '' },
  prices: { glaspreis: 56, statikGlas: 48, montageFenster: 35, montageDaemmung: 0, montagePanzer: 65, montageBleche: 15, montageHaustuere: 60 },
  rates: { grundrabatt: 14, objektrabatt: 12, verwaltungsbonus: 3, formularbonus: 3, gemeinkosten: 5, gewinn: 15 },
  rows: []
};
