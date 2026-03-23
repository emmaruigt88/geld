# Mijn Geld

Persoonlijk financieel dashboard met maandelijkse prognose, Airbnb-simulator, wensenlijst en export/import.

## Features

- **Maandoverzicht**: Alle inkomsten en uitgaven per maand (apr 2026 - dec 2027)
- **Prognose**: Saldoverloop met grafiek en emergency fund tracker (doel: 10.000 euro)
- **Airbnb simulator**: Schuif aan de knoppen om te zien hoeveel je kunt verdienen met kamerverhuur en hele-woningverhuur
- **Wensenlijst**: Toggle items aan/uit om de impact op je prognose te zien
- **Toevoegen**: Voeg eenmalige of terugkerende uitgaven/inkomsten toe
- **Export/Import**: Download je data als JSON of laad een eerder opgeslagen bestand
- **Lokale opslag**: Alles wordt bewaard in localStorage

## Installatie

```bash
npm install
npm run dev
```

## Bouwen voor productie

```bash
npm run build
```

De gebouwde bestanden staan in de `dist/` map. Deze kun je hosten op GitHub Pages, Netlify, Vercel, of elke andere statische hosting.

## Deployen op GitHub Pages

1. Installeer gh-pages: `npm install --save-dev gh-pages`
2. Voeg toe aan package.json scripts: `"deploy": "npm run build && gh-pages -d dist"`
3. Run: `npm run deploy`

## Technologie

- React 18
- Vite
- Geen externe UI-libraries (pure inline styles)
