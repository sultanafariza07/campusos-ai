# 🎓 CampusOS AI

> The Operating System for College Life

CampusOS AI is a mobile-first student productivity platform for managing notes, tasks, notifications, and (soon) AI-powered assistance — built as a React/TypeScript frontend on an Express/PostgreSQL backend.

**Status: Release Candidate v1.0** — core app (auth, notes, tasks, notifications, profile) is production-ready. See [Known Limitations](#-known-limitations) for what's intentionally still a preview.

---

## 🚀 Features

### Authentication
- Email/password signup & login
- JWT-based sessions, protected routes on both frontend and backend
- Rate-limited login/register endpoints

### Dashboard
- At-a-glance stats (real task/note counts), quick actions, recent notifications, recent activity, upcoming tasks

### Notes Module
- Full CRUD, search, live loading/empty/error states

### Tasks Module
- Full CRUD, search, status filter, sorting, due dates, validation

### Notifications
- In-app notification center + header dropdown, generated automatically from task/note activity, mark-as-read / mark-all-read, unread badge (polls every 30s)

### Activity Timeline
- Recent-activity feed on the dashboard and a dedicated timeline view *(currently sample data — see Known Limitations)*

### AI Assistant
- Chat-style UI (typing indicator, message history, auto-scroll) *(preview — not yet wired to a real AI backend; see Known Limitations)*

### Profile
- Edit name/branch/year, logout

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Security | Helmet, CORS, in-memory rate limiting |

---

## 📂 Project Structure

```plaintext
CampusOS-AI/
├── Backend/                # Node.js, Express.js, PostgreSQL
│   ├── src/
│   │   ├── api/            # API routes and controllers
│   │   ├── config/         # Configuration files (db, etc.)
│   │   ├── middleware/     # Custom Express middleware
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── .env.example        # Example environment variables
│   └── package.json
│
├── Frontend/               # React, TypeScript, Tailwind CSS
│   ├── src/
│   │   ├── assets/         # Images, fonts, etc.
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service calls
│   │   ├── state/          # State management (e.g., Zustand, Redux)
│   │   ├── styles/         # Global styles
│   │   └── utils/          # Utility functions
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (running locally or accessible via a connection string)

### 1. Clone & install
```bash
git clone <your-repo-url>
cd CampusOS-AI

cd Backend && npm install
cd ../Frontend && npm install
```

### 2. Environment setup
```bash
cd Backend
cp .env.example .env
```
Edit `.env`:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campusos_ai
JWT_SECRET=dev-secret-change-me      # change this for anything beyond local dev
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```
The Frontend doesn't need its own `.env` — it talks to the backend via a relative `/api` path proxied by Vite in dev (see `Frontend/vite.config.ts`).

### 3. Database setup
Create the database, then run the schema (idempotent — safe to re-run):
```bash
createdb campusos_ai   # or create it via your Postgres client of choice
cd Backend
npm run db:setup
```
This creates all tables (`users`, `notes`, `tasks`, `notifications`) and indexes if they don't already exist, and adds any new columns (e.g. `users.branch`/`users.year`) to existing installs without touching existing data.

### 4. Run locally
```bash
# Terminal 1
cd Backend && npm run dev      # http://localhost:3001

# Terminal 2
cd Frontend && npm run dev     # http://localhost:5173
```
Visit `http://localhost:5173`, sign up, and you're in.

---

## 🚢 Production Deployment

1. **Build both apps:**
   ```bash
   cd Backend && npm run build     # outputs to Backend/dist
   cd Frontend && npm run build    # outputs to Frontend/dist
   ```
2. **Backend:** run `node dist/index.js` (or via a process manager like pm2/systemd) behind a reverse proxy (nginx, etc.) that terminates TLS. Set real environment variables — **do not use the `.env.example` defaults**:
   - `NODE_ENV=production` — the app will now refuse to boot if `JWT_SECRET` is still the dev default, or if `DATABASE_URL` is missing.
   - `JWT_SECRET` — a long, random value (e.g. `openssl rand -base64 48`).
   - `CORS_ORIGIN` — set to your actual frontend origin.
3. **Frontend:** serve `Frontend/dist` as static files (any static host/CDN, or behind the same reverse proxy). In production there's no Vite dev proxy, so set `VITE_API_BASE_URL` (e.g. `https://api.yourdomain.com/api`) as a build-time env var before running `npm run build` — the app falls back to a relative `/api` path if it's unset, which only works if the frontend and backend share an origin.
4. **Database:** run `npm run db:setup` once against your production `DATABASE_URL` before first boot.
5. Neither `Backend/dist/` nor `.env` should ever be committed to version control — see `.gitignore`.

---

## 👥 Team
- Divyansh Singh
- Fariza Sultana (Project Lead)

---

## 🚧 Current Status

Under Development

---

Built with ❤️ for Students.
