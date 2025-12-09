# LoL Draft Helper — Full Stack (frontend/backend)

A full-stack League of Legends Draft Helper with **React + Vite** frontend and **Node.js + Express + MongoDB** backend.
Includes Riot **Match V5** integration for deriving champion **positions/roles** from match timelines, plus filtering by
roles, tags, and basic synergy hints.

## Monorepo Layout
```
lol-draft-helper/
├── frontend/           # Vite + React + Zustand app
└── backend/            # Express + MongoDB API, Riot service, seed script
```

## Quick Start

### 1) Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Riot Developer API Key (https://developer.riotgames.com/)

### 2) Backend Setup
```bash
cd backend
cp .env.example .env        # fill MONGODB_URI and RIOT_API_KEY
npm install
npm run dev                 # http://localhost:4000
```
Seed optional data:
```bash
npm run seed
```

### 3) Frontend Setup
```bash
cd frontend
cp .env.example .env        # adjust VITE_API_URL if needed
npm install
npm run dev                 # http://localhost:5173
```

## Env
**backend/.env**
```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/loldraft
RIOT_API_KEY=your-riot-api-key
REGION=na1
MATCH_REGION=americas
```
**frontend/.env**
```
VITE_API_URL=http://localhost:4000
```

## Postman
Import `postman/LoL Draft Helper.postman_collection.json`. Set `{{baseUrl}} = http://localhost:4000`.
