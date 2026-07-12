# API Endpoints

*(Source of truth: `Backend/src/routes/*.routes.ts`. All routes below except register/login require `Authorization: Bearer <token>`.)*

## Authentication

POST /api/auth/register

POST /api/auth/login

GET /api/auth/profile

PATCH /api/auth/profile — update name/branch/year (added Phase 14)

---

## Notes

GET /api/notes

GET /api/notes/:id

POST /api/notes

PUT /api/notes/:id

DELETE /api/notes/:id

*(Notes are plain title/content text — there is no file upload/download. An earlier version of this doc listed `POST /api/notes/upload`, which never actually existed.)*

---

## Tasks

GET /api/tasks

POST /api/tasks

PUT /api/tasks/:id

DELETE /api/tasks/:id

---

## Notifications (added Phase 13)

GET /api/notifications?limit=50&type=task|note|ai|general&unread=true

GET /api/notifications/unread-count

POST /api/notifications

PATCH /api/notifications/:id/read

PATCH /api/notifications/read-all

DELETE /api/notifications/:id

---

## Misc

GET /health — liveness check, no auth required
