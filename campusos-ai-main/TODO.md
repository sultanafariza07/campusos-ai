# TODO — Post v1.0

The bootstrapping checklist that used to live here (backend startup, DB
verification, end-to-end registration test, fail-fast config) is complete —
all of it shipped across Phases 1–15. This file now tracks what's honestly
still outstanding. See `CHANGELOG.md` for full history and `RELEASE_NOTES.md`
for the v1.0 summary.

## Known gaps (all intentionally out of scope through v1.0)
- [ ] Real AI backend for the AI Assistant (chat UI is complete and ready to wire up)
- [ ] Real activity-log table + API (Activity Timeline currently uses sample data)
- [ ] Real-time notifications via WebSockets/SSE (currently 30s polling)
- [ ] Avatar upload (no file storage exists yet)
- [ ] Password reset flow
- [ ] Google/OAuth sign-in

## Nice-to-haves for a future phase
- [ ] Shared rate-limit store (Redis) if the backend ever runs multiple instances
- [ ] E2E test suite
- [ ] Reconcile `Docs/Database.md` / `Docs/API.md` with the actual schema/endpoints where they still drift