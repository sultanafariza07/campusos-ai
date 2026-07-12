# CampusOS AI — v1.0 Release Notes

**Release Candidate v1.0** — Phase 15, the final phase before production.

---

## What's in v1.0

A mobile-first student productivity app with a real, working backend behind every core feature:

- **Authentication** — JWT sessions, protected routes on both frontend and backend, rate-limited login/register, production-safe secret handling.
- **Notes** — full CRUD, search, live loading/empty/error states.
- **Tasks** — full CRUD, search, status filter (all/pending/completed), sorting (due date/title/newest), validation.
- **Notifications** — real backend, generated automatically from task/note activity, header dropdown + full page, mark-as-read/mark-all-read, unread badge.
- **Dashboard** — real stats, quick actions, recent notifications, recent activity, upcoming tasks.
- **Profile** — edit name/branch/year, logout.
- **AI Assistant** — a complete, polished chat UI (typing indicator, auto-scroll, message bubbles) ready for a real AI backend to be wired in.
- **Activity Timeline** — dashboard preview + dedicated timeline page.

Every page has a loading state, an empty state, an error state, and a mobile-responsive layout.

---

## What changed in this phase (Phase 15)

- **Security**: production boot now fails fast if `JWT_SECRET` is still the dev default or `DATABASE_URL` is missing; added `.gitignore` (there wasn't one — this is how `.env` and `Backend/dist/` ended up committed in the first place); removed the committed `.env` and stale `Backend/dist/`; removed a stray dead file (`Backend/user.js`).
- **Accessibility**: modals now close on Escape and carry proper `role="dialog"`/`aria-modal` attributes; toasts are announced via `aria-live`.
- **UX**: fixed a Dashboard bug where task-load errors were captured but never actually shown to the user; standardized a stray button hover-color inconsistency.
- **Documentation**: rewrote `README.md` with accurate install/env/DB/run/deploy instructions; corrected `Docs/Database.md` and `Docs/API.md`, which had described columns and endpoints (`notes.subject`, `notes.file_url`, `POST /api/notes/upload`) that were never actually implemented; resolved a long-standing unresolved Git merge conflict in `TODO.md`.
- **Code quality**: removed one confirmed piece of backend dead code (`config.ts`'s unused `requireEnv` helper).

Full history across all 15 phases is in `CHANGELOG.md`.

---

## Known Limitations (intentional, documented)

These are honest scope boundaries, not bugs — each is called out in-product and in the docs rather than hidden:

| Feature | Status |
|---|---|
| AI Assistant | Real UI, simulated replies — no AI backend yet |
| Activity Timeline | Sample data — no activity-log backend yet |
| Notifications | Real backend, but "real-time" = 30s polling, not push |
| Avatar | Initials placeholder — no file upload/storage |
| Password reset / OAuth | Not implemented |

---

## Upgrading from a Phase 14 install

1. Pull the new code.
2. `cd Backend && npm run db:setup` — additive-only migration (new columns/tables via `IF NOT EXISTS`), safe to run against existing data.
3. If you had a committed `.env`, it's no longer in this delivery — recreate it locally from `.env.example` (see README). **Rotate your `JWT_SECRET`** if the old one was ever committed anywhere shared.
4. No frontend-breaking changes — existing sessions/tokens remain valid.

---

## Verification performed before this release

- Every new/changed import cross-checked against actual file exports (script-verified across the whole `Frontend/src` tree).
- No new npm dependencies introduced anywhere in Phases 13–15 — checked against both `package.json` files before writing any import.
- No duplicate component/type declarations.
- Backend routes re-read end-to-end for auth/ownership checks (every query filters by the authenticated `user_id`).

**Not performed** (no network access in this environment): an actual `npm install && npm run build` in either `Frontend/` or `Backend/`. This is the one step you should run before deploying — see the Testing Checklist in the delivery message.