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

## users

| Column | Type |
|----------|------|
| id | INTEGER |
| name | VARCHAR |
| email | VARCHAR |
| password_hash | TEXT |

---

## notes

| Column | Type |
|----------|------|
| id | INTEGER |
| title | VARCHAR |
| subject | VARCHAR |
| file_url | TEXT |
| user_id | INTEGER |

---

## tasks

| Column | Type |
|----------|------|
| id | INTEGER |
| title | VARCHAR |
| due_date | DATE |
| completed | BOOLEAN |
| user_id | INTEGER |
