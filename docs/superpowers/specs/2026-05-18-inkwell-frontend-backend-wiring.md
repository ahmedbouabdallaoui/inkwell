# Inkwell Frontend-Backend Wiring

## Goal
Replace hardcoded mock data in the React frontend with API calls to the FastAPI backend, and add the missing backend endpoints needed by the frontend.

## Backend Changes

### New SQLAlchemy column
- `Book.is_favourite: bool, default=False` — supports frontend favourite toggle

### New endpoints
- `PATCH /api/v1/books/{id}` — save title/pages edits, returns updated `BookResponse`
- `DELETE /api/v1/books/{id}` — delete book by id, returns `204`
- `PUT /api/v1/books/{id}/favourite` — toggle `is_favourite`, returns updated `BookResponse`

### Schema fixes
- `PdfExportRequest`: add `validation_alias="bookId"` so frontend camelCase JSON is accepted
- `BookResponse`: add `userId` and `isFavourite` fields (with `serialization_alias`)

### Response schema update
- `BookResponse` gains `userId: str` and `isFavourite: bool = False` to match frontend `Book` type

## Frontend Changes

### API layer (`src/api/`)
- `client.ts`: baseURL already at `http://localhost:8000`, routes match backend's `/api/v1/*` prefix. No path change needed if paths match.
- `books.ts`: update `fetchBooks` to unwrap `{ books, total }` response. Add `deleteBook(id)`, `updateBook(id, data)`, `toggleFavourite(id)`.
- `generation.ts`: rewrite to poll async job (same pattern as `usePdfExport`):
  1. POST `/generate` → `{ jobId }`
  2. Poll GET `/generate/{jobId}` every 2s
  3. Resolve with `book` on complete, reject on failed

### Hooks
- `useGeneration` returns `Promise<Book>` with internal polling (approved workflow)
- `useBooks` already exists, just needs `fetchBooks` to return `Book[]` correctly

### State management (`App.tsx`)
- Remove `INITIAL_BOOKS`, `EXTRA_BOOKS`, `MOCK_CHALLENGE`
- `books` from `useBooks().data ?? []`
- `challenge` from `useChallenge().data`
- `handleDeleteBook` → `deleteBook(id)` API call + invalidate cache
- `handleFavouriteBook` → `toggleFavourite(id)` API call + invalidate cache
- `handleSaveBook` → `updateBook(id, { title, pages })` API call + invalidate cache
- `handleRegenerateCover` — kept as TODO (no backend endpoint yet)

### Cleanup
- Delete `template/` directory (standalone HTML mockup, unimported)

## Auth
All book/challenge/generation/pdf endpoints require Cognito Bearer token. The axios interceptor in `client.ts` already injects the token via `fetchAuthSession()`. Unauthenticated requests fail with 401 — handled by existing error boundaries.

## Skipped
- `PageFlip.tsx` kept per user request
- `isFavourite` column migration handled via SQLAlchemy `create_all` (dev only; production uses Alembic later)
