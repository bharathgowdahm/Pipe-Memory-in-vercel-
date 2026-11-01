# 💧 PipeMemory — Underground Infrastructure Memory

A digital history of water pipes, repairs, leakage incidents and maintenance knowledge for
Panchayats, municipalities and local water departments.

**Stack:** React 18 · Vite · Leaflet (react-leaflet) · Recharts · localStorage (swap for Supabase/Neon later)

## Features
- Dashboard with KPIs, leak trends, risk distribution and top-priority pipes
- Interactive map: pipes coloured by risk, leaks, complaints, repairs, satellite layer, click-to-pick location
- Pipe registry with search, filters and per-pipe event timeline
- Forms to log leaks, repairs, complaints (auto-linked to nearest pipe) and new pipes
- Leak pattern analytics and repeat-failure hotspots
- Maintenance planner with explainable risk score, budget estimate and CSV export
- Light/dark mode, mobile bottom navigation

## Run locally
```bash
npm install
npm run dev
```

## Deploy on Vercel
1. Push this folder to a GitHub repository.
2. Go to vercel.com → **Add New → Project** → import the repo.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
4. Click **Deploy**.

## Data
Demo data is generated on first load and stored in the browser (localStorage), so each visitor has
their own copy. For shared, permanent data, replace the actions in `store.js` with calls to
a database such as Supabase (PostgreSQL + PostGIS).

## Customise
Change `MAP_CENTER` in `constants.js` to your own region.
