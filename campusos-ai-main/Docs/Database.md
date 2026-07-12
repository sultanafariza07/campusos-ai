# Database (PostgreSQL)

## Setup (local)

### 1) Install/start PostgreSQL
Use either:
- **Docker** (recommended):
  - Run a Postgres container and note the connection string.
- **Native install**: install PostgreSQL and ensure `psql` is available in your PATH.

### 2) Create a database + user
Create a database (example: `campusos_ai`) and a user with a password.

### 3) Set `DATABASE_URL`
The backend expects `DATABASE_URL` in this format:

```text
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/campusos_ai
```

Example:

```text
DATABASE_URL=postgres://campusos:campusos@localhost:5432/campusos_ai
```

Create a `.env` file in `Backend/` from `.env.example` and set the value above.

### 4) Create tables (run schema)
From `campusos-ai/Backend/`:

```bash
npm run db:setup
```

This runs `psql $DATABASE_URL -f src/db/schema.sql`.

---

## Troubleshooting: “pip install PostgreSQL” fails
If you see an error like:

- `ERROR: No matching distribution found for PostgreSQL`

That means someone tried to install a **Python** package named `PostgreSQL` via `pip`.

This repository is a **Node/TypeScript** backend and uses the npm package **`pg`** (see `Backend/package.json`).
You should **not** use `pip install PostgreSQL`.

Instead:
- Install/start **PostgreSQL server** (or use Docker)
- Set `DATABASE_URL`
- Run `npm run db:setup`

---

## Database Schema

*(Source of truth: `Backend/src/db/schema.sql`. This table is kept in sync with it — previously it described columns, like `notes.subject`/`notes.file_url`, that were never actually implemented.)*

## users

| Column | Type | Notes |
|----------|------|-------|
| id | SERIAL PK | |
| name | VARCHAR(255) | |
| email | VARCHAR(255) | UNIQUE |
| password_hash | TEXT | |
| branch | VARCHAR(100) | nullable, added Phase 14 |
| year | VARCHAR(50) | nullable, added Phase 14 |

---

## notes

| Column | Type | Notes |
|----------|------|-------|
| id | SERIAL PK | |
| user_id | INTEGER | FK → users(id), indexed |
| title | VARCHAR(255) | |
| content | TEXT | |
| created_at | TIMESTAMPTZ | default now() |
| updated_at | TIMESTAMPTZ | default now(), bumped on edit |

---

## tasks

| Column | Type | Notes |
|----------|------|-------|
| id | SERIAL PK | |
| title | VARCHAR(255) | |
| due_date | DATE | nullable |
| completed | BOOLEAN | default false |
| user_id | INTEGER | FK → users(id), indexed (added Phase 14) |

---

## notifications

*(added Phase 13)*

| Column | Type | Notes |
|----------|------|-------|
| id | SERIAL PK | |
| user_id | INTEGER | FK → users(id), indexed (also indexed with `is_read` for the unread-count query) |
| type | VARCHAR(50) | `task` \| `note` \| `ai` \| `general` |
| title | VARCHAR(255) | |
| message | TEXT | nullable |
| is_read | BOOLEAN | default false |
| created_at | TIMESTAMPTZ | default now() |

