# TrackAR Manager 🗺️

Sistem i plotë GPS tracking me React + Supabase + Vercel.

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Lucide Icons
- **Harta**: React-Leaflet (OpenStreetMap)
- **Backend/DB**: Supabase (PostgreSQL + Realtime + Auth)
- **Hosting**: Vercel
- **Grafikë**: Recharts

## Features
- ✅ Live Map me gjurmim në kohë reale (Supabase Realtime)
- ✅ Device Management (CRUD i plotë)
- ✅ GPS Client (dërgon lokacionin nga browser/telefon)
- ✅ Geofences (zona gjeografike me toggle)
- ✅ Events & Alerts (njoftime live)
- ✅ History & Grafikë shpejtësie
- ✅ Auth (login/signup me role: admin/driver)
- ✅ Dark mode profesional

---

## 🚀 Setup Hap-pas-Hapi

### 1. Supabase

1. Shko te [supabase.com](https://supabase.com) → Krijo projekt të ri
2. Shko te **SQL Editor** → Ngjit të gjithë kodin nga `supabase/migrations/001_schema.sql`
3. Ekzekuto SQL
4. Shko te **Settings → API** → Kopjo:
   - `Project URL`
   - `anon public` key

### 2. Klonim dhe instalim lokal

```bash
git clone https://github.com/YOUR_USERNAME/traccar-manager.git
cd traccar-manager
npm install
cp .env.example .env
```

Edito `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev
```

### 3. Krijo Admin User

1. Hap `http://localhost:5173`
2. Kliko "Regjistrohu" → zgjidh rolin **Admin**
3. Konfirmo email (kontrollo inbox)
4. Hyr me email + fjalëkalim

### 4. Shto Pajisje të Parë

1. Shko te faqja **Pajisjet**
2. Kliko **Shto Pajisje**
3. Plotëso: emri, targa, ikona, ngjyra
4. Kopjo **Token ID** që gjenerohet automatikisht

### 5. GPS Client (telefoni ose browser)

1. Shko te faqja **GPS Client**
2. Zgjidh pajisjen nga lista
3. Vendos intervalin e dërgimit (5s - 5min)
4. Kliko **Fillo Transmetimin Live**
5. Shiko pajisjen në hartë në kohë reale!

### 6. Deploy në Vercel

```bash
# Instalo Vercel CLI
npm i -g vercel

# Deploy
vercel

# Vendos env variables kur kërkohet:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

Ose nëpërmjet Vercel Dashboard:
1. Shko te [vercel.com](https://vercel.com) → Import GitHub repo
2. Framework: **Vite**
3. Build command: `npm run build`
4. Output: `dist`
5. Environment Variables: shto VITE_SUPABASE_URL dhe VITE_SUPABASE_ANON_KEY
6. Deploy!

---

## 📡 GPS Client API (HTTP direkt)

Çdo pajisje GPS mund të dërgojë pozicion me HTTP POST:

```http
POST https://YOUR_PROJECT.supabase.co/rest/v1/rpc/upsert_position
Content-Type: application/json
apikey: YOUR_ANON_KEY

{
  "p_identifier": "device-token-001",
  "p_lat": 41.3275,
  "p_lng": 19.8187,
  "p_speed": 60,
  "p_course": 90,
  "p_altitude": 120,
  "p_accuracy": 5,
  "p_battery": 85
}
```

Kjo mund të integrohet me:
- Traccar Client app (Android/iOS) duke konfiguruar server URL
- Arduino/ESP32 me GSM modul
- Çdo pajisje GPS me HTTP support

---

## Struktura e Projektit

```
src/
├── components/
│   ├── layout/      Layout.tsx (sidebar navigation)
│   └── map/         LiveMap.tsx (Leaflet map)
├── hooks/
│   ├── useAuth.tsx   Authentication context
│   ├── useDevices.ts Device management + realtime
│   ├── useGeofences.ts Geofence CRUD
│   ├── useEvents.ts  Events + realtime alerts
│   └── useGPSClient.ts Browser GPS sender
├── pages/
│   ├── LoginPage.tsx
│   ├── MapPage.tsx     Live tracking
│   ├── DevicesPage.tsx Device CRUD
│   ├── GeofencesPage.tsx
│   ├── EventsPage.tsx
│   ├── HistoryPage.tsx + recharts
│   ├── ClientPage.tsx  GPS sender
│   └── SettingsPage.tsx
├── lib/
│   └── supabase.ts   Client + TypeScript types
└── supabase/
    └── migrations/
        └── 001_schema.sql  Skema e plotë e DB
```

---

## Licenca

MIT — Përdoreni lirisht për projekte personale dhe komerciale.
