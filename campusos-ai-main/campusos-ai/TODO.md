# CampusOS - Phase 7 TODO

## Backend
- [x] Add study_planner table to Backend/src/db/schema.sql (subject, topic, study_date, completed, created_at, user_id FK)
- [x] Create Study Planner router: GET/POST/PUT/DELETE /api/study-planner
- [x] Add Study planner service helpers (optional) for listing/updating
- [x] Add TypeScript types for study planner
- [x] Wire router into Backend/src/index.ts

## Frontend
- [x] Add API client methods in Frontend/src/lib/api.ts for study planner CRUD
- [x] Create /study-planner page (StudyPlannerPage.tsx) with:
  - [ ] Today's sessions + upcoming
  - [ ] Add session modal (validate required fields)
  - [ ] Edit session modal
  - [ ] Delete confirmation
  - [ ] Empty/loading/error states
  - [ ] Simple monthly calendar highlighting study dates and today
  - [ ] Selecting a day filters sessions list
- [x] Add new route in Frontend/src/App.tsx for /study-planner
- [x] Integrate Dashboard integration:
  - [x] Fetch today + upcoming study sessions
  - [x] Show next study date
  - [x] Update DashboardPage.tsx UI cards/sections

## Validation / Error Handling
- [x] Ensure all backend endpoints validate required fields (subject, topic, studyDate)
- [x] Ensure each user only sees their own sessions
- [x] Return proper HTTP status codes (400/401/404/500 etc.)

## Build / Compile
- [x] TypeScript compile backend + frontend without errors
- [x] Run lint/build if available
