# Merz Fenster Kalkulation App

Render-ready desktop web app for the Merz window calculation workflow. It recreates the Excel-style calculation logic in a browser app with a square, desktop-first UI, integrated Merz branding and a non-clipping header layout.

## Features

- Desktop-first calculation workspace
- Project data and pricing controls
- Add, duplicate and delete positions
- Live calculation of material, montage, net, VAT and gross totals
- JSON export/import
- CSV export
- Browser print/PDF offer view
- Local browser saving with localStorage
- Render-ready Node server
- GitHub Actions CI

## Local run

```bash
npm ci
npm start
```

Open:

```text
http://localhost:3000
```

## Test

```bash
npm test
```

The test checks that the included Emler demo case reaches the known Excel reference total of **47.920,01 € netto**.

## Deploy to Render

This repo includes `render.yaml`.

1. Connect this GitHub repo in Render.
2. Create a Web Service.
3. Render will use:
   - build command: `npm install`
   - start command: `npm start`

## Notes

No database is required. Data is stored locally in the browser and can be exported/imported as JSON.
