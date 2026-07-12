# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-XX-XX (Release Candidate)

### Added
#### Backend
- **Middleware**: Added `asyncHandler` to all routes to ensure async errors are caught and handled, preventing unhandled promise rejections.
- **Logging & Security**: Implemented a request logger (`middleware/requestLogger.ts`) and basic rate limiting (`middleware/rateLimit.ts`) for login and registration endpoints to protect against brute-force attacks.
- **API**: New `PATCH /api/auth/profile` endpoint to allow users to update their name, branch, and year.
- **Database**: Added `branch` and `year` columns to the `users` table. Added a database index on `tasks.user_id` to improve query performance.

#### Frontend
- **Core UI**: Added a reusable `Spinner` and a global `ErrorBoundary` to prevent the app from crashing on render errors, showing a fallback UI instead.
- **Features**: Implemented a full-featured Tasks page (from a "Coming Soon" placeholder) with CRUD operations, search, filtering, and sorting.
- **Features**: Built the UI shell for the AI Assistant, including chat bubbles and a typing indicator, ready for backend integration.
- **Accessibility**: Modals now close on the 'Escape' key and have appropriate ARIA roles (`dialog`, `aria-modal`). The shared `Toast` component is now announced by screen readers.
- **Hooks**: Created a new shared `useEscapeKey` hook to handle closing modals.

### Changed
#### Backend
- **Security**: The application now refuses to start in production if a default development `JWT_SECRET` is used or if `DATABASE_URL` is missing.
- **Project Clean-up**: Removed the committed `.env` file from source control. Secrets should never be committed. Added a global `.gitignore` to prevent this and other artifacts (like `dist/`) from being committed in the future.
- **Validation**: Added input validation for email format, name/title lengths, and `due_date` format on API routes.

#### Frontend
- **UI/UX**: The Dashboard now shows a proper loading skeleton and empty state for tasks instead of mock data. Stat cards show "–" instead of "0" while loading.
- **UI/UX**: The Notes page now has client-side search functionality with a dedicated "no results" empty state.
- **UI/UX**: The Profile page's "Edit Profile" feature is now fully functional, calling the new backend endpoint and updating the UI in place.
- **Code Quality**: Deduplicated code by creating a shared `Toast` component (used in 3 pages) and shared notification styling logic.

#### Documentation
- **README**: Completely rewrote `README.md` with accurate feature descriptions, a project structure overview, and verified setup instructions for both frontend and backend.
- **API & DB Docs**: Updated `Docs/API.md` and `Docs/Database.md` to accurately reflect the current state of the API endpoints and database schema.
- **Project Docs**: Updated `Docs/Features.md`, `Docs/Roadmap.md`, and `TODO.md` to align with the v1.0 release. Added a new `RELEASE_NOTES.md` file.

### Fixed
----
----
----
----
- **Dashboard**: Fixed an issue where task-loading errors were not displayed to the user.
- **Notes**: Fixed a bug where all notes incorrectly showed "Updated recently" regardless of their actual update timestamp.
- **UI**: Corrected a minor button hover color inconsistency in the `ErrorBoundary` component.

I hope this helps you move forward with your project!

<!--
[PROMPT_SUGGESTION]Can you add a new section for `Deprecated` features to this changelog?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Based on this changelog, update the `README.md` to reflect the latest changes.[/PROMPT_SUGGESTION]
