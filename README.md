# WanderSync — Collaborative Travel Planning App

A real-time collaborative travel planning web app built with Next.js, Node.js/Express, PostgreSQL, Prisma, and Socket.io.

---

## Architecture

```
wandersync/
├── backend/                  # Node.js + Express + Socket.io
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (all models)
│   │   └── seed.ts           # Demo data
│   └── src/
│       ├── index.ts          # Server entry, Socket.io init
│       ├── middleware/
│       │   ├── auth.ts       # JWT middleware
│       │   └── errorHandler.ts
│       ├── lib/
│       │   └── prisma.ts     # Prisma singleton
│       ├── routes/
│       │   ├── auth.ts       # POST /api/auth/register|login, GET /me
│       │   ├── trips.ts      # CRUD + invite join
│       │   ├── itinerary.ts  # CRUD + bulk reorder
│       │   ├── chat.ts       # Messages REST fallback
│       │   ├── voting.ts     # Suggestions + votes
│       │   └── notifications.ts
│       ├── services/
│       │   └── notifications.ts
│       └── socket/
│           └── index.ts      # All real-time events
│
└── frontend/                 # Next.js 14 App Router
    └── src/
        ├── app/
        │   ├── login/page.tsx
        │   ├── dashboard/page.tsx
        │   ├── trip/[id]/page.tsx
        │   └── join/[code]/page.tsx
        ├── components/
        │   ├── itinerary/
        │   │   ├── ItineraryPanel.tsx  # DnD sortable list
        │   │   ├── AddItemModal.tsx
        │   │   └── EditItemModal.tsx
        │   ├── map/
        │   │   ├── MapComponent.tsx    # Google Maps + Directions
        │   │   └── PlaceSearch.tsx     # Places autocomplete
        │   ├── chat/
        │   │   └── ChatPanel.tsx       # Real-time chat
        │   ├── voting/
        │   │   └── VotingPanel.tsx     # Suggestions + voting
        │   └── ui/
        │       ├── Modal.tsx
        │       ├── Avatar.tsx
        │       ├── TripHeader.tsx
        │       ├── PresenceBar.tsx
        │       ├── NotificationBell.tsx
        │       ├── CreateTripModal.tsx
        │       └── JoinTripModal.tsx
        ├── hooks/
        │   └── useSocket.ts    # Binds Socket.io events → store
        ├── lib/
        │   ├── api.ts          # Axios client + all API methods
        │   ├── socket.ts       # Socket.io singleton
        │   └── stores/
        │       ├── authStore.ts # Zustand auth state
        │       └── tripStore.ts # Zustand trip/real-time state
        └── types/index.ts
```

---

## Real-time Event Map

| Client emits           | Server broadcasts to         | Store action          |
|------------------------|------------------------------|-----------------------|
| `trip:join`            | `presence:online`            | `setOnlineUsers`      |
| `chat:send`            | `chat:message` (room)        | `addMessage`          |
| `chat:typing`          | `chat:typing` (room)         | `setTyping`           |
| `itinerary:editing`    | `itinerary:editing` (room)   | (cursor highlight)    |
| REST POST /itinerary   | `itinerary:added` (room)     | `addItem`             |
| REST PUT /itinerary/:id| `itinerary:updated` (room)   | `updateItem`          |
| REST DELETE /itinerary | `itinerary:deleted` (room)   | `deleteItem`          |
| REST PUT /reorder      | `itinerary:reordered` (room) | `reorderItems`        |
| REST POST /voting      | `voting:suggestion_added`    | `addSuggestion`       |
| REST POST /voting/vote | `voting:updated`             | `updateSuggestion`    |
| —                      | `notification:new` (user)    | `addNotification`     |

---

## Setup: Manual (Recommended for Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ running locally
- A Google Maps API key with **Maps JavaScript API**, **Places API**, and **Directions API** enabled

### 1. Clone & install

```bash
git clone <repo>
cd wandersync

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL and JWT_SECRET

# Frontend
cd ../frontend
npm install
cp .env.example .env
# Edit .env: set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### 2. Database setup

```bash
cd backend

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# (Optional) Seed demo data
npx ts-node prisma/seed.ts
```

### 3. Start backend

```bash
cd backend
npm run dev
# → Running on http://localhost:4000
```

### 4. Start frontend

```bash
cd frontend
npm run dev
# → Running on http://localhost:3000
```

### 5. Open app

Visit http://localhost:3000

Demo accounts (if seeded):
- `alice@example.com` / `password123`
- `bob@example.com` / `password123`

---

## Setup: Docker Compose

```bash
# From repo root, set your Google Maps key:
export GOOGLE_MAPS_API_KEY=your_key_here

docker-compose up --build

# First time — run migrations inside the backend container:
docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npx ts-node prisma/seed.ts
```

---

## Google Maps API Setup

1. Go to https://console.cloud.google.com
2. Create a project → enable these APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
3. Create credentials → API Key
4. Add the key to `frontend/.env`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
   ```
5. Restrict the key to your domain in production

---

## REST API Reference

### Auth
```
POST   /api/auth/register   { email, name, password }
POST   /api/auth/login      { email, password }
GET    /api/auth/me         (Bearer token)
```

### Trips
```
GET    /api/trips
POST   /api/trips           { name, description?, destination?, startDate?, endDate? }
GET    /api/trips/:id
PUT    /api/trips/:id
DELETE /api/trips/:id
POST   /api/trips/join/:inviteCode
GET    /api/trips/:id/members
```

### Itinerary
```
GET    /api/itinerary/trip/:tripId
POST   /api/itinerary       { tripId, title, location?, lat?, lng?, date?, startTime?, endTime?, notes?, dayIndex?, order? }
PUT    /api/itinerary/:id
DELETE /api/itinerary/:id
PUT    /api/itinerary/reorder/bulk   { items: [{ id, order, dayIndex }] }
```

### Chat
```
GET    /api/chat/trip/:tripId  ?limit=50&before=<ISO date>
POST   /api/chat/trip/:tripId  { content }
```

### Voting
```
GET    /api/voting/trip/:tripId
POST   /api/voting          { tripId, title, location?, lat?, lng?, description? }
POST   /api/voting/:id/vote { value: 1 | -1 }
DELETE /api/voting/:id
```

### Notifications
```
GET    /api/notifications
PUT    /api/notifications/read-all
PUT    /api/notifications/:id/read
```

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/wandersync
JWT_SECRET=your-secret-at-least-32-chars
PORT=4000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

---

## Production Checklist

- [ ] Set strong `JWT_SECRET` (32+ random chars)
- [ ] Set `NODE_ENV=production`
- [ ] Restrict Google Maps API key to your domain
- [ ] Use a managed PostgreSQL (e.g. Supabase, Neon, RDS)
- [ ] Add rate limiting (`express-rate-limit`)
- [ ] Set up HTTPS (certificates via Let's Encrypt / Vercel)
- [ ] Deploy backend to Railway / Render / Fly.io
- [ ] Deploy frontend to Vercel
- [ ] Use Redis adapter for Socket.io if running multiple backend instances:
  ```ts
  import { createAdapter } from '@socket.io/redis-adapter';
  io.adapter(createAdapter(pubClient, subClient));
  ```

---

## Key Technical Decisions

**Why Zustand over Redux?** Minimal boilerplate, built-in devtools, works perfectly with Socket.io event callbacks.

**Why Socket.io over raw WebSockets?** Auto-reconnect, rooms, namespaces, and fallback to long-polling for corporate firewalls.

**Why dnd-kit over react-beautiful-dnd?** Active maintenance, better TypeScript support, and works with React 18 concurrent mode.

**Real-time + REST hybrid:** Itinerary mutations go through REST (for validation, notifications, DB write) and the server broadcasts via Socket.io. Chat messages can go through either Socket.io (preferred, faster) or REST (fallback).
# TravelApp
