# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (Vite, http://localhost:5173)
npm run build        # tsc type-check + Vite production build
npm test             # run all tests once (Vitest)
npm run test:ui      # Vitest browser UI

# Run a single test file
npx vitest run src/components/book/OpenBook.test.tsx

# Run tests matching a pattern
npx vitest run --reporter=verbose -t "edit mode"
```

## Architecture

**Inkwell** is an AI story prompt generator. Users fill in a form (genre, characters, description), the backend calls Amazon Bedrock to generate a 400–500 word story and a cover image, and the result is displayed as a physical book the user can read, edit, and export.

### Frontend — this repo

React 19 SPA built with Vite 8 + TypeScript 6. Deployed to S3 behind CloudFront.

```
src/
  App.tsx                  ← root: holds books[], selectedBookId, editSignal; wires all state
  types/index.ts           ← Book, Challenge, GenerationInput, PdfJob, User
  api/                     ← thin Axios wrappers (client.ts injects Cognito Bearer token)
  hooks/                   ← React Query useBooks, useChallenge, useGeneration, usePdfExport
  auth/                    ← CognitoProvider (Amplify v6) + useAuth hook
  components/
    layout/                ← AppShell (2-zone flex), LeftPanel (assembles shelf)
    bookshelf/             ← BookShelf (paginated, 8/page) + BookCover (spine + action icons)
    book/                  ← OpenBook (closed→open→edit states), BookPage, PageFlip
    challenge/             ← ChallengeCard
    generation/            ← GenerationOverlay, GenerationForm, InkDropLoader
    brand/                 ← Wordmark
```

### Backend (not in this repo)

FastAPI on EC2 t3.micro behind an ALB. See `ArchyAWS.md` for the full AWS service map.

### Data flow

1. User submits `GenerationInput` → `POST /generate` → EC2 calls Bedrock Nova Lite (text) + Nova Canvas (cover image) → returns a `Book` object
2. The new book is pushed onto the shelf; `useInvalidateBooks()` refreshes the list from `GET /books`
3. PDF export → `POST /pdf/export` → SQS job → Lambda → S3 → presigned URL polled every 2 s by `usePdfExport`

### Current state: hardcoded mock data

`App.tsx` has two hardcoded books (`INITIAL_BOOKS`) and a hardcoded challenge (`MOCK_CHALLENGE`) that bypass `useBooks` and `useChallenge`. Remove these and wire the hooks once the FastAPI backend is deployed. The hooks and API modules are fully implemented and tested.

## Styling system

**Tailwind v4** — no `tailwind.config.ts`. All design tokens live in the `@theme` block at the top of `src/index.css`. Use `bg-ink-bg`, `text-ink-violet`, `font-display` etc.

Complex visual effects (3D spine, book spread, page flip, shelf plank) are plain CSS classes also in `src/index.css` — not Tailwind utilities. Edit them there, not in component files.

The two visual registers intentionally contrast:
- **Shell** (dark): `#0F0F12` background, Inter font, violet `#8B6FE8` accents
- **Book interior** (warm): `#F5EDD9` paper, Lora serif, `#2C2416` ink

## `OpenBook` state machine

`OpenBook` has three meaningful states gated by `isOpen` and `editMode`:

| isOpen | editMode | Shows |
|--------|----------|-------|
| false  | —        | Closed cover (720×500, click to open) |
| true   | false    | Two-page reading spread |
| true   | true     | Edit mode (title input, regen cover, textarea per page) |

`editSignal` (a counter in `App.tsx`) triggers immediate entry to edit mode from the shelf's ✎ icon. Keyboard ← → navigate spreads when `isOpen && !editMode`.

The page flip uses `flushSync` + imperative DOM (`rightPageRef`) with `perspective(800px) rotateY()` — NOT Framer Motion — because `overflow: hidden` on `.book-spread` flattens CSS `transform-style: preserve-3d`. The `perspective()` function form applies locally without a parent stacking context.

## `BookCover` + shelf actions

Each spine has three icon buttons (♡ / ✎ / ✕) that pop below on hover via `.book-container:hover .book-actions`. The ✎ button calls `onEdit(id)` → `App.handleEditBook` which increments `editSignal` and sets `selectedBookId`.

`BookShelf` paginates at 8 books per page (2 rows of 4). The selected spine shows a violet glow ring; there is no hover flip animation on spines.

## Environment variables

```
VITE_API_URL                  # FastAPI base URL (default: http://localhost:8000)
VITE_COGNITO_USER_POOL_ID     # from Cognito stack output
VITE_COGNITO_CLIENT_ID        # from Cognito stack output
VITE_COGNITO_DOMAIN           # e.g. inkwell.auth.us-east-1.amazoncognito.com
```

Put these in `.env.local` (gitignored). `CognitoProvider` calls `Amplify.configure()` at module parse time with these values.

## Testing conventions

- Vitest globals (`test`, `expect`, `vi`) are available without importing — configured in `vite.config.ts`
- Use `vi.clearAllMocks()` in `beforeEach` when `vi.fn()` mocks are defined at module scope
- Hook tests wrap with a fresh `QueryClient` per test using `createElement(QueryClientProvider, { client: qc }, children)` — avoids cross-test cache pollution
- `CognitoProvider` is always mocked in component tests that render `App` (`vi.mock('./auth/CognitoProvider', ...)`) because it calls `Amplify.configure()` with `window.location.origin` at import time
