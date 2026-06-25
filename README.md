# 🗼 Tokyo Apt — Apartment Hunter

Paste property listing URLs and instantly see commute times to your preset key locations, all on a dark-themed map of Tokyo.

## Features

- **Paste any listing URL** (arealty.jp, suumo.jp, etc.) → auto-extracts address & geocodes it
- **Interactive Tokyo map** with custom dark styling
- **Preset locations** (Shinjuku, Shibuya, Akihabara, Roppongi, Ikebukuro) — add/remove your own
- **Hover any property** → animated commute card shows transit & walking times with step-by-step routes
- **Fully deployable to Vercel** in one click

## Setup

### 1. Google Maps API Key

Go to [console.cloud.google.com](https://console.cloud.google.com) and enable:
- **Maps JavaScript API**
- **Geocoding API**
- **Directions API**

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
GOOGLE_MAPS_API_KEY=your_key_here
```

### 3. Run locally

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add the environment variables in the Vercel dashboard under **Settings → Environment Variables**.

## How it works

1. You paste a property URL into the sidebar
2. `/api/scrape` fetches the listing page, extracts the address using DOM parsing, then geocodes it via Google Geocoding API
3. The property pin appears on the map
4. Hovering the property in the list opens a commute card
5. `/api/commute` fetches transit + walking directions from Google Directions API for each preset location
6. Commute times and step-by-step routes appear in the card, tabbed by destination
