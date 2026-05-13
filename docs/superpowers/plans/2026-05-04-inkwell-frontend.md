# Inkwell Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Inkwell React SPA — a dark editorial app where users generate AI story prompts and read them as flippable books, with a bookshelf sidebar of all past stories.

**Architecture:** Vite + React 18 + TypeScript SPA with two visual registers — a clean Notion-dark shell (left panel + overlays) and a warm theatrical open-book reader. Framer Motion handles the book-open shared layout animation; CSS 3D `rotateY` handles page flips. Server state lives in TanStack React Query; auth via AWS Amplify + Cognito.

**Tech Stack:** React 18, TypeScript 5, Vite 5, Tailwind CSS (custom Inkwell theme), Framer Motion 11, TanStack React Query 5, Axios, AWS Amplify v6 (Cognito), Vitest, React Testing Library, @testing-library/user-event, @testing-library/jest-dom

---

## File Map

```
inkwell/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                          # Tailwind directives + page-flip keyframes
│   ├── test-setup.ts
│   ├── types/
│   │   └── index.ts                       # Book, Challenge, GenerationInput, PdfJob, User
│   ├── api/
│   │   ├── client.ts                      # Axios instance with auth header injection
│   │   ├── books.ts                       # GET /books, GET /books/:id
│   │   ├── generation.ts                  # POST /generate
│   │   ├── challenge.ts                   # GET /challenge
│   │   └── pdf.ts                         # POST /pdf/export, GET /pdf/:jobId
│   ├── auth/
│   │   ├── CognitoProvider.tsx            # Amplify config + AuthContext
│   │   └── useAuth.ts                     # useContext wrapper
│   ├── hooks/
│   │   ├── useBooks.ts                    # useQuery — book list + single book
│   │   ├── useChallenge.ts               # useQuery — today's challenge + streak
│   │   ├── useGeneration.ts              # useMutation — trigger story generation
│   │   └── usePdfExport.ts              # useMutation + polling — PDF job
│   └── components/
│       ├── brand/
│       │   └── Wordmark.tsx              # ◆ Inkwell logotype
│       ├── challenge/
│       │   └── ChallengeCard.tsx         # Sticky challenge card + streak counter
│       ├── bookshelf/
│       │   ├── BookCover.tsx             # Single cover thumbnail with hover state
│       │   └── BookShelf.tsx             # 2-col grid + empty state + New Story btn
│       ├── layout/
│       │   ├── LeftPanel.tsx             # Wordmark + ChallengeCard + BookShelf
│       │   └── AppShell.tsx              # 2-zone flex layout wrapper
│       ├── book/
│       │   ├── BookPage.tsx              # Single paginated page (Lora serif)
│       │   ├── PageFlip.tsx              # CSS 3D flip wrapper + click zones
│       │   └── OpenBook.tsx              # Two-page spread + empty state
│       └── generation/
│           ├── InkDropLoader.tsx         # Animated ink-drop ripple
│           ├── GenerationForm.tsx        # Genre / Characters / Setting fields
│           └── GenerationOverlay.tsx     # Full-screen modal wrapper
```

---

## Task 1: Project Scaffold + Design Tokens

**Files:**
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `src/index.css`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/test-setup.ts`

- [ ] **Step 1: Scaffold the project**

```bash
cd /home/ahmed/dev/js/WebstormProjects/storyteller
npm create vite@latest . -- --template react-ts
```

When prompted about existing files, choose to overwrite only the generated scaffold files. Keep `ArchyAWS.md` and `docs/`.

- [ ] **Step 2: Install all dependencies**

```bash
npm install @tanstack/react-query axios aws-amplify framer-motion
npm install -D tailwindcss postcss autoprefixer @tailwindcss/vite vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Vite with Tailwind + Vitest**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 4: Configure the Inkwell Tailwind theme**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          bg:      '#0F0F12',
          surface: '#1A1A1F',
          raised:  '#242429',
          border:  '#2E2E35',
          text:    '#E8E8F0',
          muted:   '#8888A0',
          violet:  '#8B6FE8',
          paper:   '#F5EDD9',
          bookink: '#2C2416',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        serif:   ['Lora', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono:    ['Inter Mono', 'monospace'],
      },
      boxShadow: {
        'violet-glow': '0 0 0 2px rgba(139,111,232,0.35)',
        'book':        '0 20px 60px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 5: Write index.css with Tailwind directives + page-flip keyframes**

```css
/* src/index.css */
@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Mono&family=Lora:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@700&display=swap');

@keyframes page-flip-out {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(-90deg); }
}

@keyframes page-flip-in {
  from { transform: rotateY(90deg); }
  to   { transform: rotateY(0deg); }
}

@keyframes ink-ripple {
  0%   { transform: scale(0); opacity: 0.7; }
  100% { transform: scale(4); opacity: 0; }
}

.page-flip-out {
  animation: page-flip-out 200ms ease-in forwards;
  transform-origin: left center;
  backface-visibility: hidden;
}

.page-flip-in {
  animation: page-flip-in 200ms ease-out forwards;
  transform-origin: left center;
  backface-visibility: hidden;
}

* { box-sizing: border-box; }
```

- [ ] **Step 6: Write test setup**

```typescript
// src/test-setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Write a smoke-test App**

```tsx
// src/App.tsx
export default function App() {
  return <div data-testid="app-root">Inkwell</div>
}
```

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 8: Add ink drop SVG favicon**

Replace the default Vite favicon in `public/` with an SVG favicon. Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#0F0F12" rx="6"/>
  <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle"
        font-size="18" fill="#8B6FE8" font-family="serif">◆</text>
</svg>
```

Update `index.html` to reference it:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 9: Write and run the smoke test**

Create `src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders without crashing', () => {
  render(<App />)
  expect(screen.getByTestId('app-root')).toBeInTheDocument()
})
```

```bash
npx vitest run
```
Expected: `1 passed`

- [ ] **Step 10: Commit**

```bash
git init
git add index.html vite.config.ts tailwind.config.ts postcss.config.js src/ package.json package-lock.json
git commit -m "feat: scaffold Inkwell — Vite + React + Tailwind + Vitest"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `src/types/index.ts`
- Create: `src/types/index.test.ts`

- [ ] **Step 1: Write failing type-shape test**

```typescript
// src/types/index.test.ts
import type { Book, Challenge, GenerationInput, PdfJob } from './index'

test('Book type has required shape', () => {
  const book: Book = {
    id: '1',
    title: 'The Dragon Wakes',
    genre: 'Fantasy',
    characters: 'Arin, a reluctant mage',
    setting: 'A collapsing empire',
    coverImageUrl: 'https://example.com/cover.jpg',
    pages: ['Once upon a time...', 'The second page...'],
    createdAt: '2026-05-04T10:00:00Z',
    userId: 'user-1',
  }
  expect(book.id).toBe('1')
  expect(book.pages).toHaveLength(2)
})

test('Challenge type has required shape', () => {
  const challenge: Challenge = {
    id: 'c1',
    prompt: 'Write about a letter never sent.',
    date: '2026-05-04',
    streakCount: 7,
  }
  expect(challenge.streakCount).toBe(7)
})
```

```bash
npx vitest run src/types/index.test.ts
```
Expected: FAIL — `Cannot find module './index'`

- [ ] **Step 2: Write the type definitions**

```typescript
// src/types/index.ts
export interface Book {
  id: string
  title: string
  genre: string
  characters: string
  setting: string
  coverImageUrl: string
  pages: string[]
  createdAt: string
  userId: string
}

export interface Challenge {
  id: string
  prompt: string
  date: string
  streakCount: number
}

export interface GenerationInput {
  genre: string
  characters: string
  setting: string
}

export interface PdfJob {
  jobId: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
  downloadUrl?: string
}

export interface User {
  id: string
  email: string
  name: string
}
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
npx vitest run src/types/index.test.ts
```
Expected: `2 passed`

- [ ] **Step 4: Commit**

```bash
git add src/types/
git commit -m "feat: add Inkwell domain types"
```

---

## Task 3: API Client + Auth Provider

**Files:**
- Create: `src/api/client.ts`
- Create: `src/auth/CognitoProvider.tsx`
- Create: `src/auth/useAuth.ts`
- Create: `src/api/client.test.ts`

- [ ] **Step 1: Write failing API client test**

```typescript
// src/api/client.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof axios>('axios')
  return {
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        interceptors: {
          request: { use: vi.fn() },
        },
      })),
    },
  }
})

describe('api client', () => {
  it('creates an axios instance with the correct base URL', async () => {
    import.meta.env.VITE_API_URL = 'https://api.inkwell.app'
    const { apiClient } = await import('./client')
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://api.inkwell.app' })
    )
  })
})
```

```bash
npx vitest run src/api/client.test.ts
```
Expected: FAIL — `Cannot find module './client'`

- [ ] **Step 2: Write the API client**

```typescript
// src/api/client.ts
import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession()
    const token = session.tokens?.idToken?.toString()
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {
    // unauthenticated — continue without header
  }
  return config
})
```

- [ ] **Step 3: Run client test**

```bash
npx vitest run src/api/client.test.ts
```
Expected: `1 passed`

- [ ] **Step 4: Write the CognitoProvider**

```tsx
// src/auth/CognitoProvider.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Amplify } from 'aws-amplify'
import { getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth'
import type { User } from '../types'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId:       import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        oauth: {
          domain:            import.meta.env.VITE_COGNITO_DOMAIN,
          scopes:            ['openid', 'email', 'profile'],
          redirectSignIn:    [window.location.origin],
          redirectSignOut:   [window.location.origin],
          responseType:      'code',
        },
      },
    },
  },
})

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function CognitoProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUser({ id: u.userId, email: u.signInDetails?.loginId ?? '', name: u.username }))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login:  () => signInWithRedirect(),
      logout: () => signOut(),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
```

- [ ] **Step 5: Write the useAuth hook**

```typescript
// src/auth/useAuth.ts
import { useContext } from 'react'
import { AuthContext } from './CognitoProvider'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within CognitoProvider')
  return ctx
}
```

- [ ] **Step 6: Commit**

```bash
git add src/api/client.ts src/api/client.test.ts src/auth/
git commit -m "feat: add API client with Cognito auth token injection"
```

---

## Task 4: AppShell + Wordmark

**Files:**
- Create: `src/components/brand/Wordmark.tsx`
- Create: `src/components/brand/Wordmark.test.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/AppShell.test.tsx`

- [ ] **Step 1: Write failing Wordmark test**

```tsx
// src/components/brand/Wordmark.test.tsx
import { render, screen } from '@testing-library/react'
import { Wordmark } from './Wordmark'

test('renders the Inkwell brand name', () => {
  render(<Wordmark />)
  expect(screen.getByText('Inkwell')).toBeInTheDocument()
})

test('renders the ink drop glyph', () => {
  render(<Wordmark />)
  expect(screen.getByText('◆')).toBeInTheDocument()
})
```

```bash
npx vitest run src/components/brand/Wordmark.test.tsx
```
Expected: FAIL

- [ ] **Step 2: Write the Wordmark component**

```tsx
// src/components/brand/Wordmark.tsx
export function Wordmark() {
  return (
    <div className="flex items-center gap-2 px-5 py-4">
      <span className="text-ink-violet text-sm" aria-hidden>◆</span>
      <span className="font-display text-ink-text text-lg font-bold tracking-wide">
        Inkwell
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Run Wordmark test**

```bash
npx vitest run src/components/brand/Wordmark.test.tsx
```
Expected: `2 passed`

- [ ] **Step 4: Write failing AppShell test**

```tsx
// src/components/layout/AppShell.test.tsx
import { render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'

test('renders left panel and main stage slots', () => {
  render(
    <AppShell
      leftPanel={<div>left</div>}
      mainStage={<div>main</div>}
    />
  )
  expect(screen.getByText('left')).toBeInTheDocument()
  expect(screen.getByText('main')).toBeInTheDocument()
})
```

```bash
npx vitest run src/components/layout/AppShell.test.tsx
```
Expected: FAIL

- [ ] **Step 5: Write AppShell**

```tsx
// src/components/layout/AppShell.tsx
import { ReactNode } from 'react'

interface AppShellProps {
  leftPanel: ReactNode
  mainStage: ReactNode
}

export function AppShell({ leftPanel, mainStage }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-bg">
      <aside className="w-[280px] flex-none border-r border-ink-border bg-ink-surface flex flex-col">
        {leftPanel}
      </aside>
      <main className="flex-1 overflow-hidden flex items-center justify-center">
        {mainStage}
      </main>
    </div>
  )
}
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```
Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add src/components/brand/ src/components/layout/AppShell.tsx src/components/layout/AppShell.test.tsx
git commit -m "feat: add AppShell layout and Inkwell wordmark"
```

---

## Task 5: ChallengeCard

**Files:**
- Create: `src/components/challenge/ChallengeCard.tsx`
- Create: `src/components/challenge/ChallengeCard.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/components/challenge/ChallengeCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChallengeCard } from './ChallengeCard'

const defaultProps = {
  prompt: 'Write about a letter never sent.',
  streakCount: 7,
  onAccept: vi.fn(),
  onWriteNow: vi.fn(),
  accepted: false,
}

test('shows prompt teaser and streak count', () => {
  render(<ChallengeCard {...defaultProps} />)
  expect(screen.getByText(/Write about a letter/)).toBeInTheDocument()
  expect(screen.getByText('7')).toBeInTheDocument()
})

test('calls onAccept when Accept Challenge is clicked', async () => {
  const user = userEvent.setup()
  render(<ChallengeCard {...defaultProps} />)
  await user.click(screen.getByRole('button', { name: /Accept Challenge/i }))
  expect(defaultProps.onAccept).toHaveBeenCalledOnce()
})

test('shows Write Now button when accepted', () => {
  render(<ChallengeCard {...defaultProps} accepted />)
  expect(screen.getByRole('button', { name: /Write Now/i })).toBeInTheDocument()
})

test('calls onWriteNow when Write Now is clicked', async () => {
  const user = userEvent.setup()
  render(<ChallengeCard {...defaultProps} accepted />)
  await user.click(screen.getByRole('button', { name: /Write Now/i }))
  expect(defaultProps.onWriteNow).toHaveBeenCalledOnce()
})
```

```bash
npx vitest run src/components/challenge/ChallengeCard.test.tsx
```
Expected: FAIL

- [ ] **Step 2: Write the ChallengeCard component**

```tsx
// src/components/challenge/ChallengeCard.tsx
interface ChallengeCardProps {
  prompt: string
  streakCount: number
  accepted: boolean
  onAccept: () => void
  onWriteNow: () => void
}

export function ChallengeCard({ prompt, streakCount, accepted, onAccept, onWriteNow }: ChallengeCardProps) {
  return (
    <div className="mx-3 mt-3 rounded-lg border border-ink-violet bg-ink-raised p-4"
         style={{ boxShadow: '0 0 12px rgba(139,111,232,0.2)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-sans font-medium text-ink-muted uppercase tracking-widest">
          Daily Challenge
        </span>
        <span className="flex items-center gap-1 font-mono text-sm text-ink-text">
          🔥 <span>{streakCount}</span>
        </span>
      </div>

      <p className="text-sm font-sans text-ink-text leading-relaxed mb-3 line-clamp-2">
        {prompt}
      </p>

      {!accepted ? (
        <button
          onClick={onAccept}
          className="w-full rounded-md bg-ink-violet py-1.5 text-sm font-sans font-medium text-white hover:opacity-90 transition-opacity"
        >
          Accept Challenge
        </button>
      ) : (
        <button
          onClick={onWriteNow}
          className="w-full rounded-md border border-ink-violet py-1.5 text-sm font-sans font-medium text-ink-violet hover:bg-ink-violet/10 transition-colors"
        >
          Write Now
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/components/challenge/ChallengeCard.test.tsx
```
Expected: `4 passed`

- [ ] **Step 4: Commit**

```bash
git add src/components/challenge/
git commit -m "feat: add ChallengeCard with streak counter and accept/write-now states"
```

---

## Task 6: BookCover + BookShelf

**Files:**
- Create: `src/components/bookshelf/BookCover.tsx`
- Create: `src/components/bookshelf/BookShelf.tsx`
- Create: `src/components/bookshelf/BookCover.test.tsx`
- Create: `src/components/bookshelf/BookShelf.test.tsx`

- [ ] **Step 1: Write failing BookCover test**

```tsx
// src/components/bookshelf/BookCover.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookCover } from './BookCover'

const book = {
  id: '1',
  title: 'The Dragon Wakes',
  coverImageUrl: 'https://example.com/cover.jpg',
}

test('renders book cover image with alt text', () => {
  render(<BookCover book={book} onSelect={vi.fn()} isSelected={false} />)
  expect(screen.getByRole('img', { name: 'The Dragon Wakes cover' })).toBeInTheDocument()
})

test('calls onSelect when clicked', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  render(<BookCover book={book} onSelect={onSelect} isSelected={false} />)
  await user.click(screen.getByRole('img', { name: 'The Dragon Wakes cover' }))
  expect(onSelect).toHaveBeenCalledWith('1')
})
```

```bash
npx vitest run src/components/bookshelf/BookCover.test.tsx
```
Expected: FAIL

- [ ] **Step 2: Write BookCover**

```tsx
// src/components/bookshelf/BookCover.tsx
import { motion } from 'framer-motion'
import type { Book } from '../../types'

interface BookCoverProps {
  book: Pick<Book, 'id' | 'title' | 'coverImageUrl'>
  onSelect: (id: string) => void
  isSelected: boolean
}

export function BookCover({ book, onSelect, isSelected }: BookCoverProps) {
  return (
    <motion.button
      layoutId={`book-cover-${book.id}`}
      onClick={() => onSelect(book.id)}
      className="relative w-full aspect-[2/3] rounded-sm overflow-hidden focus:outline-none"
      whileHover={{ scale: 1.04, rotate: 0 }}
      initial={{ rotate: -1 }}
      animate={isSelected ? { scale: 1.08, rotate: 0 } : { rotate: -1 }}
      style={isSelected ? { boxShadow: '0 0 0 2px rgba(139,111,232,0.7)' } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <img
        src={book.coverImageUrl}
        alt={`${book.title} cover`}
        className="w-full h-full object-cover"
      />
      {isSelected && (
        <div className="absolute inset-0 rounded-sm"
             style={{ boxShadow: 'inset 0 0 0 2px rgba(139,111,232,0.5)' }} />
      )}
    </motion.button>
  )
}
```

- [ ] **Step 3: Write failing BookShelf test**

```tsx
// src/components/bookshelf/BookShelf.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookShelf } from './BookShelf'
import type { Book } from '../../types'

const books: Book[] = [
  { id: '1', title: 'Book One', genre: 'Fantasy', characters: '', setting: '', coverImageUrl: 'a.jpg', pages: [], createdAt: '', userId: 'u1' },
  { id: '2', title: 'Book Two', genre: 'Sci-Fi',  characters: '', setting: '', coverImageUrl: 'b.jpg', pages: [], createdAt: '', userId: 'u1' },
]

test('renders all book covers', () => {
  render(<BookShelf books={books} selectedBookId={null} onSelect={vi.fn()} onNewStory={vi.fn()} />)
  expect(screen.getByRole('img', { name: 'Book One cover' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Book Two cover' })).toBeInTheDocument()
})

test('shows empty shelf slot when no books', () => {
  render(<BookShelf books={[]} selectedBookId={null} onSelect={vi.fn()} onNewStory={vi.fn()} />)
  expect(screen.getByText(/Create your first story/i)).toBeInTheDocument()
})

test('calls onNewStory when New Story is clicked', async () => {
  const user = userEvent.setup()
  const onNewStory = vi.fn()
  render(<BookShelf books={books} selectedBookId={null} onSelect={vi.fn()} onNewStory={onNewStory} />)
  await user.click(screen.getByRole('button', { name: /New Story/i }))
  expect(onNewStory).toHaveBeenCalledOnce()
})
```

```bash
npx vitest run src/components/bookshelf/BookShelf.test.tsx
```
Expected: FAIL

- [ ] **Step 4: Write BookShelf**

```tsx
// src/components/bookshelf/BookShelf.tsx
import { BookCover } from './BookCover'
import type { Book } from '../../types'

interface BookShelfProps {
  books: Book[]
  selectedBookId: string | null
  onSelect: (id: string) => void
  onNewStory: () => void
}

export function BookShelf({ books, selectedBookId, onSelect, onNewStory }: BookShelfProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {books.length === 0 ? (
          <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-ink-violet/50">
            <span className="text-xs font-sans text-ink-muted text-center leading-relaxed px-4">
              + Create your first story
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {books.map((book) => (
              <BookCover
                key={book.id}
                book={book}
                onSelect={onSelect}
                isSelected={selectedBookId === book.id}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex-none px-3 pb-3 pt-2 border-t border-ink-border">
        <button
          onClick={onNewStory}
          className="w-full rounded-md border border-ink-border py-2 text-sm font-sans text-ink-muted hover:text-ink-text hover:border-ink-violet/50 transition-colors"
        >
          + New Story
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run all bookshelf tests**

```bash
npx vitest run src/components/bookshelf/
```
Expected: `5 passed`

- [ ] **Step 6: Commit**

```bash
git add src/components/bookshelf/
git commit -m "feat: add BookCover and BookShelf with empty state"
```

---

## Task 7: LeftPanel

**Files:**
- Create: `src/components/layout/LeftPanel.tsx`
- Create: `src/components/layout/LeftPanel.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/components/layout/LeftPanel.test.tsx
import { render, screen } from '@testing-library/react'
import { LeftPanel } from './LeftPanel'

const noop = vi.fn()

test('renders Wordmark, ChallengeCard, and BookShelf', () => {
  render(
    <LeftPanel
      books={[]}
      selectedBookId={null}
      onSelectBook={noop}
      onNewStory={noop}
      challenge={{ id: 'c1', prompt: 'A letter never sent.', date: '2026-05-04', streakCount: 3 }}
      challengeAccepted={false}
      onAcceptChallenge={noop}
      onWriteNow={noop}
    />
  )
  expect(screen.getByText('Inkwell')).toBeInTheDocument()
  expect(screen.getByText(/A letter never sent/)).toBeInTheDocument()
  expect(screen.getByText(/Create your first story/i)).toBeInTheDocument()
})
```

```bash
npx vitest run src/components/layout/LeftPanel.test.tsx
```
Expected: FAIL

- [ ] **Step 2: Write LeftPanel**

```tsx
// src/components/layout/LeftPanel.tsx
import { Wordmark } from '../brand/Wordmark'
import { ChallengeCard } from '../challenge/ChallengeCard'
import { BookShelf } from '../bookshelf/BookShelf'
import type { Book, Challenge } from '../../types'

interface LeftPanelProps {
  books: Book[]
  selectedBookId: string | null
  onSelectBook: (id: string) => void
  onNewStory: () => void
  challenge: Challenge | null
  challengeAccepted: boolean
  onAcceptChallenge: () => void
  onWriteNow: () => void
}

export function LeftPanel({
  books, selectedBookId, onSelectBook, onNewStory,
  challenge, challengeAccepted, onAcceptChallenge, onWriteNow,
}: LeftPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-none border-b border-ink-border">
        <Wordmark />
      </div>

      {challenge && (
        <div className="flex-none">
          <ChallengeCard
            prompt={challenge.prompt}
            streakCount={challenge.streakCount}
            accepted={challengeAccepted}
            onAccept={onAcceptChallenge}
            onWriteNow={onWriteNow}
          />
        </div>
      )}

      <BookShelf
        books={books}
        selectedBookId={selectedBookId}
        onSelect={onSelectBook}
        onNewStory={onNewStory}
      />
    </div>
  )
}
```

- [ ] **Step 3: Run test**

```bash
npx vitest run src/components/layout/LeftPanel.test.tsx
```
Expected: `1 passed`

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/LeftPanel.tsx src/components/layout/LeftPanel.test.tsx
git commit -m "feat: assemble LeftPanel from Wordmark, ChallengeCard, BookShelf"
```

---

## Task 8: OpenBook Component

**Files:**
- Create: `src/components/book/BookPage.tsx`
- Create: `src/components/book/BookPage.test.tsx`
- Create: `src/components/book/OpenBook.tsx`
- Create: `src/components/book/OpenBook.test.tsx`

- [ ] **Step 1: Write failing BookPage test**

```tsx
// src/components/book/BookPage.test.tsx
import { render, screen } from '@testing-library/react'
import { BookPage } from './BookPage'

test('renders page content in serif font container', () => {
  render(<BookPage content="Once upon a time in a land far away..." side="right" />)
  expect(screen.getByText(/Once upon a time/)).toBeInTheDocument()
})

test('renders left page with title metadata', () => {
  render(
    <BookPage
      side="left"
      title="The Dragon Wakes"
      genre="Fantasy"
      createdAt="2026-05-04"
      content=""
    />
  )
  expect(screen.getByText('The Dragon Wakes')).toBeInTheDocument()
  expect(screen.getByText('Fantasy')).toBeInTheDocument()
})
```

```bash
npx vitest run src/components/book/BookPage.test.tsx
```
Expected: FAIL

- [ ] **Step 2: Write BookPage**

```tsx
// src/components/book/BookPage.tsx
interface RightPageProps {
  side: 'right'
  content: string
  title?: never
  genre?: never
  createdAt?: never
}

interface LeftPageProps {
  side: 'left'
  content: string
  title: string
  genre: string
  createdAt: string
}

type BookPageProps = RightPageProps | LeftPageProps

export function BookPage(props: BookPageProps) {
  const baseClasses = 'h-full w-full bg-ink-paper p-8 overflow-hidden flex flex-col'

  if (props.side === 'left') {
    return (
      <div className={baseClasses}>
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4">
          <span className="inline-block px-3 py-1 rounded-full bg-ink-bookink/10 text-ink-bookink text-xs font-sans font-medium">
            {props.genre}
          </span>
          <h1 className="font-display text-2xl text-ink-bookink leading-tight">
            {props.title}
          </h1>
          <p className="text-xs font-sans text-ink-bookink/50 mt-2">
            {new Date(props.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={baseClasses}>
      <p className="font-serif text-sm text-ink-bookink leading-relaxed whitespace-pre-wrap">
        {props.content}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Run BookPage test**

```bash
npx vitest run src/components/book/BookPage.test.tsx
```
Expected: `2 passed`

- [ ] **Step 4: Write failing OpenBook tests**

```tsx
// src/components/book/OpenBook.test.tsx
import { render, screen } from '@testing-library/react'
import { OpenBook } from './OpenBook'
import type { Book } from '../../types'

test('shows empty state when no book is selected', () => {
  render(<OpenBook book={null} onPdfExport={vi.fn()} onShare={vi.fn()} />)
  expect(screen.getByText(/Select a story from your shelf/i)).toBeInTheDocument()
})

const book: Book = {
  id: '1', title: 'The Dragon Wakes', genre: 'Fantasy',
  characters: 'Arin', setting: 'Empire', coverImageUrl: 'c.jpg',
  pages: ['Page one content', 'Page two content', 'Page three content'],
  createdAt: '2026-05-04T00:00:00Z', userId: 'u1',
}

test('shows book title and first page content when a book is open', () => {
  render(<OpenBook book={book} onPdfExport={vi.fn()} onShare={vi.fn()} />)
  expect(screen.getByText('The Dragon Wakes')).toBeInTheDocument()
  expect(screen.getByText(/Page one content/)).toBeInTheDocument()
})

test('shows correct page counter', () => {
  render(<OpenBook book={book} onPdfExport={vi.fn()} onShare={vi.fn()} />)
  expect(screen.getByText('1 / 3')).toBeInTheDocument()
})
```

```bash
npx vitest run src/components/book/OpenBook.test.tsx
```
Expected: FAIL

- [ ] **Step 5: Write OpenBook**

```tsx
// src/components/book/OpenBook.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookPage } from './BookPage'
import { PageFlip } from './PageFlip'
import type { Book } from '../../types'

interface OpenBookProps {
  book: Book | null
  onPdfExport: () => void
  onShare: () => void
}

export function OpenBook({ book, onPdfExport, onShare }: OpenBookProps) {
  const [currentPage, setCurrentPage] = useState(0)

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-ink-muted">
        <div className="w-24 h-32 rounded border-2 border-dashed border-ink-border opacity-30" />
        <p className="text-sm font-sans">Select a story from your shelf</p>
      </div>
    )
  }

  const totalPages = book.pages.length

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        layoutId={`book-cover-${book.id}`}
        className="flex rounded-sm overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)', width: 680, height: 480 }}
      >
        {/* Left page */}
        <div className="w-1/2 border-r border-ink-bookink/10">
          <BookPage
            side="left"
            title={book.title}
            genre={book.genre}
            createdAt={book.createdAt}
            content=""
          />
        </div>

        {/* Right page with flip */}
        <PageFlip
          key={currentPage}
          onFlipForward={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))}
          onFlipBack={() => setCurrentPage((p) => Math.max(p - 1, 0))}
          canFlipForward={currentPage < totalPages - 1}
          canFlipBack={currentPage > 0}
        >
          <BookPage side="right" content={book.pages[currentPage]} />
        </PageFlip>
      </motion.div>

      {/* Bottom bar */}
      <div className="flex items-center gap-6 text-ink-muted">
        <span className="font-mono text-xs">{currentPage + 1} / {totalPages}</span>
        <button onClick={onPdfExport} className="text-xs font-sans hover:text-ink-text transition-colors" aria-label="Export PDF">
          PDF ↓
        </button>
        <button onClick={onShare} className="text-xs font-sans hover:text-ink-text transition-colors" aria-label="Share">
          Share ↗
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run OpenBook tests**

```bash
npx vitest run src/components/book/OpenBook.test.tsx
```
Expected: `3 passed`

- [ ] **Step 7: Commit**

```bash
git add src/components/book/BookPage.tsx src/components/book/BookPage.test.tsx src/components/book/OpenBook.tsx src/components/book/OpenBook.test.tsx
git commit -m "feat: add BookPage and OpenBook two-page spread with empty state"
```

---

## Task 9: PageFlip Animation

**Files:**
- Create: `src/components/book/PageFlip.tsx`
- Create: `src/components/book/PageFlip.test.tsx`

- [ ] **Step 1: Write failing PageFlip tests**

```tsx
// src/components/book/PageFlip.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PageFlip } from './PageFlip'

const defaultProps = {
  onFlipForward: vi.fn(),
  onFlipBack: vi.fn(),
  canFlipForward: true,
  canFlipBack: true,
  children: <div>Page content</div>,
}

test('renders children', () => {
  render(<PageFlip {...defaultProps} />)
  expect(screen.getByText('Page content')).toBeInTheDocument()
})

test('calls onFlipForward when right edge is clicked', async () => {
  const user = userEvent.setup()
  const onFlipForward = vi.fn()
  render(<PageFlip {...defaultProps} onFlipForward={onFlipForward} />)
  await user.click(screen.getByRole('button', { name: /next page/i }))
  expect(onFlipForward).toHaveBeenCalledOnce()
})

test('calls onFlipBack when left edge is clicked', async () => {
  const user = userEvent.setup()
  const onFlipBack = vi.fn()
  render(<PageFlip {...defaultProps} onFlipBack={onFlipBack} />)
  await user.click(screen.getByRole('button', { name: /previous page/i }))
  expect(onFlipBack).toHaveBeenCalledOnce()
})

test('forward button is disabled when canFlipForward is false', () => {
  render(<PageFlip {...defaultProps} canFlipForward={false} />)
  expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled()
})

test('back button is disabled when canFlipBack is false', () => {
  render(<PageFlip {...defaultProps} canFlipBack={false} />)
  expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled()
})
```

```bash
npx vitest run src/components/book/PageFlip.test.tsx
```
Expected: FAIL

- [ ] **Step 2: Write PageFlip**

```tsx
// src/components/book/PageFlip.tsx
import { useState, ReactNode } from 'react'

interface PageFlipProps {
  children: ReactNode
  onFlipForward: () => void
  onFlipBack: () => void
  canFlipForward: boolean
  canFlipBack: boolean
}

export function PageFlip({ children, onFlipForward, onFlipBack, canFlipForward, canFlipBack }: PageFlipProps) {
  const [animating, setAnimating] = useState(false)

  function handleFlip(direction: 'forward' | 'back') {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      direction === 'forward' ? onFlipForward() : onFlipBack()
      setAnimating(false)
    }, 400)
  }

  return (
    <div className="relative w-1/2 h-full overflow-hidden" style={{ perspective: 1200 }}>
      {/* Page content */}
      <div className={`w-full h-full ${animating ? 'page-flip-out' : ''}`}
           style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}>
        {children}
      </div>

      {/* Left edge click zone — go back */}
      <button
        onClick={() => handleFlip('back')}
        disabled={!canFlipBack || animating}
        aria-label="Previous page"
        className="absolute left-0 top-0 w-8 h-full z-10 cursor-w-resize disabled:cursor-default opacity-0"
      />

      {/* Right edge click zone — go forward */}
      <button
        onClick={() => handleFlip('forward')}
        disabled={!canFlipForward || animating}
        aria-label="Next page"
        className="absolute right-0 top-0 w-8 h-full z-10 cursor-e-resize disabled:cursor-default opacity-0"
      />
    </div>
  )
}
```

- [ ] **Step 3: Run PageFlip tests**

```bash
npx vitest run src/components/book/PageFlip.test.tsx
```
Expected: `5 passed`

- [ ] **Step 4: Run all book tests**

```bash
npx vitest run src/components/book/
```
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/components/book/PageFlip.tsx src/components/book/PageFlip.test.tsx
git commit -m "feat: add PageFlip with CSS 3D rotation and click zones"
```

---

## Task 10: Generation Overlay

**Files:**
- Create: `src/components/generation/InkDropLoader.tsx`
- Create: `src/components/generation/GenerationForm.tsx`
- Create: `src/components/generation/GenerationOverlay.tsx`
- Create: `src/components/generation/GenerationForm.test.tsx`
- Create: `src/components/generation/GenerationOverlay.test.tsx`

- [ ] **Step 1: Write failing GenerationForm test**

```tsx
// src/components/generation/GenerationForm.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerationForm } from './GenerationForm'

test('renders genre, characters, and setting fields', () => {
  render(<GenerationForm onSubmit={vi.fn()} loading={false} />)
  expect(screen.getByLabelText(/Genre/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Characters/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Setting/i)).toBeInTheDocument()
})

test('calls onSubmit with field values', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(<GenerationForm onSubmit={onSubmit} loading={false} />)
  await user.type(screen.getByLabelText(/Genre/i), 'Fantasy')
  await user.type(screen.getByLabelText(/Characters/i), 'A reluctant mage')
  await user.type(screen.getByLabelText(/Setting/i), 'A collapsing empire')
  await user.click(screen.getByRole('button', { name: /Generate/i }))
  expect(onSubmit).toHaveBeenCalledWith({
    genre: 'Fantasy',
    characters: 'A reluctant mage',
    setting: 'A collapsing empire',
  })
})

test('shows ink-drop loader and disables button when loading', () => {
  render(<GenerationForm onSubmit={vi.fn()} loading />)
  expect(screen.getByRole('button', { name: /Generate/i })).toBeDisabled()
})
```

```bash
npx vitest run src/components/generation/GenerationForm.test.tsx
```
Expected: FAIL

- [ ] **Step 2: Write InkDropLoader**

```tsx
// src/components/generation/InkDropLoader.tsx
export function InkDropLoader() {
  return (
    <span className="relative inline-flex h-4 w-4" aria-hidden>
      <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75"
            style={{ animation: 'ink-ripple 1s ease-out infinite' }} />
      <span className="relative inline-flex rounded-full h-4 w-4 bg-white opacity-50" />
    </span>
  )
}
```

- [ ] **Step 3: Write GenerationForm**

```tsx
// src/components/generation/GenerationForm.tsx
import { useState, FormEvent } from 'react'
import { InkDropLoader } from './InkDropLoader'
import type { GenerationInput } from '../../types'

interface GenerationFormProps {
  onSubmit: (input: GenerationInput) => void
  loading: boolean
  initialValues?: Partial<GenerationInput>
}

export function GenerationForm({ onSubmit, loading, initialValues }: GenerationFormProps) {
  const [genre,      setGenre]      = useState(initialValues?.genre      ?? '')
  const [characters, setCharacters] = useState(initialValues?.characters ?? '')
  const [setting,    setSetting]    = useState(initialValues?.setting    ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ genre, characters, setting })
  }

  const fieldClass = "w-full rounded-md border border-ink-border bg-ink-bg px-3 py-2 text-sm font-sans text-ink-text placeholder-ink-muted focus:outline-none focus:border-ink-violet transition-colors"
  const labelClass = "block text-xs font-sans font-medium text-ink-muted mb-1"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div>
        <label htmlFor="genre" className={labelClass}>Genre</label>
        <input id="genre" className={fieldClass} placeholder="Fantasy, Sci-Fi, Horror…"
               value={genre} onChange={(e) => setGenre(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="characters" className={labelClass}>Characters</label>
        <input id="characters" className={fieldClass} placeholder="A reluctant mage, her mentor…"
               value={characters} onChange={(e) => setCharacters(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="setting" className={labelClass}>Setting</label>
        <input id="setting" className={fieldClass} placeholder="A collapsing empire at war…"
               value={setting} onChange={(e) => setSetting(e.target.value)} required />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-md bg-ink-violet py-2.5 text-sm font-sans font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
      >
        {loading ? <><InkDropLoader /> Generating…</> : 'Generate'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Write failing GenerationOverlay test**

```tsx
// src/components/generation/GenerationOverlay.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerationOverlay } from './GenerationOverlay'

test('is not visible when open is false', () => {
  render(<GenerationOverlay open={false} onClose={vi.fn()} onSubmit={vi.fn()} loading={false} />)
  expect(screen.queryByText(/What will you write/i)).not.toBeInTheDocument()
})

test('is visible and shows Inkwell wordmark when open', () => {
  render(<GenerationOverlay open onClose={vi.fn()} onSubmit={vi.fn()} loading={false} />)
  expect(screen.getByText('Inkwell')).toBeInTheDocument()
  expect(screen.getByText(/What will you write/i)).toBeInTheDocument()
})

test('calls onClose when backdrop is clicked', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<GenerationOverlay open onClose={onClose} onSubmit={vi.fn()} loading={false} />)
  await user.click(screen.getByTestId('overlay-backdrop'))
  expect(onClose).toHaveBeenCalledOnce()
})
```

```bash
npx vitest run src/components/generation/GenerationOverlay.test.tsx
```
Expected: FAIL

- [ ] **Step 5: Write GenerationOverlay**

```tsx
// src/components/generation/GenerationOverlay.tsx
import { AnimatePresence, motion } from 'framer-motion'
import { Wordmark } from '../brand/Wordmark'
import { GenerationForm } from './GenerationForm'
import type { GenerationInput } from '../../types'

interface GenerationOverlayProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: GenerationInput) => void
  loading: boolean
  initialValues?: Partial<GenerationInput>
}

export function GenerationOverlay({ open, onClose, onSubmit, loading, initialValues }: GenerationOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="overlay-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(15,15,18,0.95)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-xl bg-ink-surface border border-ink-border p-8 flex flex-col gap-6"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-1">
              <Wordmark />
              <p className="text-sm font-sans text-ink-muted">
                What will you write today?
              </p>
            </div>
            <GenerationForm onSubmit={onSubmit} loading={loading} initialValues={initialValues} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 6: Run all generation tests**

```bash
npx vitest run src/components/generation/
```
Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add src/components/generation/
git commit -m "feat: add GenerationOverlay with ink-drop loader and animated backdrop"
```

---

## Task 11: API Hooks

**Files:**
- Create: `src/api/books.ts`
- Create: `src/api/generation.ts`
- Create: `src/api/challenge.ts`
- Create: `src/api/pdf.ts`
- Create: `src/hooks/useBooks.ts`
- Create: `src/hooks/useChallenge.ts`
- Create: `src/hooks/useGeneration.ts`
- Create: `src/hooks/usePdfExport.ts`
- Create: `src/hooks/useBooks.test.ts`
- Create: `src/hooks/useChallenge.test.ts`
- Create: `src/hooks/useGeneration.test.ts`
- Create: `src/hooks/usePdfExport.test.ts`

- [ ] **Step 1: Write the API modules**

```typescript
// src/api/books.ts
import { apiClient } from './client'
import type { Book } from '../types'

export const fetchBooks  = ()   => apiClient.get<Book[]>('/books').then((r) => r.data)
export const fetchBook   = (id: string) => apiClient.get<Book>(`/books/${id}`).then((r) => r.data)
```

```typescript
// src/api/generation.ts
import { apiClient } from './client'
import type { Book, GenerationInput } from '../types'

export const generateStory = (input: GenerationInput) =>
  apiClient.post<Book>('/generate', input).then((r) => r.data)
```

```typescript
// src/api/challenge.ts
import { apiClient } from './client'
import type { Challenge } from '../types'

export const fetchChallenge = () => apiClient.get<Challenge>('/challenge').then((r) => r.data)
```

```typescript
// src/api/pdf.ts
import { apiClient } from './client'
import type { PdfJob } from '../types'

export const requestPdfExport = (bookId: string) =>
  apiClient.post<PdfJob>(`/pdf/export`, { bookId }).then((r) => r.data)

export const fetchPdfJob = (jobId: string) =>
  apiClient.get<PdfJob>(`/pdf/${jobId}`).then((r) => r.data)
```

- [ ] **Step 2: Write the hooks**

```typescript
// src/hooks/useBooks.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchBooks } from '../api/books'

export function useBooks() {
  return useQuery({ queryKey: ['books'], queryFn: fetchBooks })
}

export function useInvalidateBooks() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['books'] })
}
```

```typescript
// src/hooks/useChallenge.ts
import { useQuery } from '@tanstack/react-query'
import { fetchChallenge } from '../api/challenge'

export function useChallenge() {
  return useQuery({ queryKey: ['challenge'], queryFn: fetchChallenge })
}
```

```typescript
// src/hooks/useGeneration.ts
import { useMutation } from '@tanstack/react-query'
import { generateStory } from '../api/generation'
import { useInvalidateBooks } from './useBooks'

export function useGeneration() {
  const invalidateBooks = useInvalidateBooks()
  return useMutation({
    mutationFn: generateStory,
    onSuccess: () => invalidateBooks(),
  })
}
```

```typescript
// src/hooks/usePdfExport.ts
import { useMutation } from '@tanstack/react-query'
import { requestPdfExport, fetchPdfJob } from '../api/pdf'

export function usePdfExport() {
  return useMutation({
    mutationFn: async (bookId: string) => {
      const job = await requestPdfExport(bookId)
      return new Promise<string>((resolve, reject) => {
        const poll = setInterval(async () => {
          try {
            const updated = await fetchPdfJob(job.jobId)
            if (updated.status === 'complete' && updated.downloadUrl) {
              clearInterval(poll)
              resolve(updated.downloadUrl)
            } else if (updated.status === 'failed') {
              clearInterval(poll)
              reject(new Error('PDF generation failed'))
            }
          } catch (e) {
            clearInterval(poll)
            reject(e)
          }
        }, 2000)
      })
    },
  })
}
```

- [ ] **Step 3: Write hook tests**

```typescript
// src/hooks/useBooks.test.ts
import { vi, describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useBooks } from './useBooks'

vi.mock('../api/books', () => ({
  fetchBooks: vi.fn().mockResolvedValue([
    { id: '1', title: 'Test Book', genre: 'Fantasy', characters: '', setting: '',
      coverImageUrl: '', pages: [], createdAt: '', userId: 'u1' },
  ]),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useBooks', () => {
  it('returns a list of books', async () => {
    const { result } = renderHook(() => useBooks(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].title).toBe('Test Book')
  })
})
```

```typescript
// src/hooks/useChallenge.test.ts
import { vi, describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useChallenge } from './useChallenge'

vi.mock('../api/challenge', () => ({
  fetchChallenge: vi.fn().mockResolvedValue({
    id: 'c1', prompt: 'Write about loss.', date: '2026-05-04', streakCount: 5,
  }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useChallenge', () => {
  it('returns today\'s challenge with streak count', async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.streakCount).toBe(5)
  })
})
```

```typescript
// src/hooks/useGeneration.test.ts
import { vi, describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useGeneration } from './useGeneration'

const mockBook = { id: '99', title: 'New Story', genre: 'Fantasy', characters: '', setting: '',
                   coverImageUrl: '', pages: ['p1'], createdAt: '', userId: 'u1' }

vi.mock('../api/generation', () => ({ generateStory: vi.fn().mockResolvedValue(mockBook) }))
vi.mock('./useBooks', () => ({ useInvalidateBooks: vi.fn(() => vi.fn()) }))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useGeneration', () => {
  it('calls generateStory and returns the new book', async () => {
    const { result } = renderHook(() => useGeneration(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ genre: 'Fantasy', characters: 'Arin', setting: 'Empire' })
    })
    expect(result.current.data).toEqual(mockBook)
  })
})
```

```typescript
// src/hooks/usePdfExport.test.ts
import { vi, describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { usePdfExport } from './usePdfExport'

vi.mock('../api/pdf', () => ({
  requestPdfExport: vi.fn().mockResolvedValue({ jobId: 'job-1', status: 'pending' }),
  fetchPdfJob:      vi.fn().mockResolvedValue({ jobId: 'job-1', status: 'complete', downloadUrl: 'https://s3.example.com/story.pdf' }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('usePdfExport', () => {
  it('polls and resolves with the download URL', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => usePdfExport(), { wrapper })

    let url: string | undefined
    act(() => { result.current.mutateAsync('book-1').then((u) => { url = u }) })
    await act(async () => { vi.advanceTimersByTime(2500) })

    expect(url).toBe('https://s3.example.com/story.pdf')
    vi.useRealTimers()
  })
})
```

- [ ] **Step 4: Run all hook tests**

```bash
npx vitest run src/hooks/
```
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/api/ src/hooks/
git commit -m "feat: add API modules and React Query hooks for books, challenge, generation, and PDF export"
```

---

## Task 12: Wire Everything Together

**Files:**
- Modify: `src/App.tsx`
- Create: `.env.local` (not committed — just a note for developer)

- [ ] **Step 1: Create `.env.local` with required variables**

Create a `.env.local` file (do NOT commit it — it contains secrets) with this shape:

```bash
VITE_API_URL=http://localhost:8000
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_COGNITO_DOMAIN=inkwell.auth.us-east-1.amazoncognito.com
```

Obtain actual values from the infrastructure/backend team (these are outputs of the Cognito Terraform/CDK stack).

Add to `.gitignore`:
```
.env.local
```

- [ ] **Step 2: Write the wired-up App**

```tsx
// src/App.tsx
import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { CognitoProvider } from './auth/CognitoProvider'
import { AppShell } from './components/layout/AppShell'
import { LeftPanel } from './components/layout/LeftPanel'
import { OpenBook } from './components/book/OpenBook'
import { GenerationOverlay } from './components/generation/GenerationOverlay'
import { useBooks } from './hooks/useBooks'
import { useChallenge } from './hooks/useChallenge'
import { useGeneration } from './hooks/useGeneration'
import { usePdfExport } from './hooks/usePdfExport'
import type { Book, GenerationInput } from './types'

const queryClient = new QueryClient()

function InkwellApp() {
  const [selectedBookId,      setSelectedBookId]      = useState<string | null>(null)
  const [overlayOpen,         setOverlayOpen]         = useState(false)
  const [challengeAccepted,   setChallengeAccepted]   = useState(false)
  const [overlayInitialValues, setOverlayInitialValues] = useState<Partial<GenerationInput> | undefined>()

  const { data: books = []   } = useBooks()
  const { data: challenge    } = useChallenge()
  const generation              = useGeneration()
  const pdfExport               = usePdfExport()

  const selectedBook: Book | null = books.find((b) => b.id === selectedBookId) ?? null

  // Auto-open new book after generation
  useEffect(() => {
    if (generation.data) {
      setSelectedBookId(generation.data.id)
      setOverlayOpen(false)
    }
  }, [generation.data])

  // Page title
  useEffect(() => {
    document.title = selectedBook
      ? `Inkwell — ${selectedBook.title}`
      : 'Inkwell'
  }, [selectedBook])

  function handleGenerate(input: GenerationInput) {
    generation.mutate(input)
  }

  function handlePdfExport() {
    if (!selectedBook) return
    pdfExport.mutateAsync(selectedBook.id).then((url) => {
      window.open(url, '_blank')
    })
  }

  function handleShare() {
    if (!selectedBook) return
    pdfExport.mutateAsync(selectedBook.id).then((url) => {
      navigator.clipboard.writeText(url)
    })
  }

  function handleWriteNow() {
    if (!challenge) return
    setOverlayInitialValues({ genre: '', characters: '', setting: challenge.prompt })
    setOverlayOpen(true)
  }

  return (
    <>
      <AppShell
        leftPanel={
          <LeftPanel
            books={books}
            selectedBookId={selectedBookId}
            onSelectBook={setSelectedBookId}
            onNewStory={() => { setOverlayInitialValues(undefined); setOverlayOpen(true) }}
            challenge={challenge ?? null}
            challengeAccepted={challengeAccepted}
            onAcceptChallenge={() => setChallengeAccepted(true)}
            onWriteNow={handleWriteNow}
          />
        }
        mainStage={
          <OpenBook
            book={selectedBook}
            onPdfExport={handlePdfExport}
            onShare={handleShare}
          />
        }
      />

      <AnimatePresence>
        {overlayOpen && (
          <GenerationOverlay
            open={overlayOpen}
            onClose={() => setOverlayOpen(false)}
            onSubmit={handleGenerate}
            loading={generation.isPending}
            initialValues={overlayInitialValues}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CognitoProvider>
        <InkwellApp />
      </CognitoProvider>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 3: Write App integration test**

```tsx
// src/App.test.tsx
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./auth/CognitoProvider', () => ({
  CognitoProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('./hooks/useBooks',     () => ({ useBooks:     () => ({ data: [] }),            useInvalidateBooks: () => vi.fn() }))
vi.mock('./hooks/useChallenge', () => ({ useChallenge: () => ({ data: undefined }) }))
vi.mock('./hooks/useGeneration',() => ({ useGeneration: () => ({ mutate: vi.fn(), isPending: false, data: undefined }) }))
vi.mock('./hooks/usePdfExport', () => ({ usePdfExport:  () => ({ mutateAsync: vi.fn() }) }))

test('renders the Inkwell shell', () => {
  render(<App />)
  expect(screen.getByText('Inkwell')).toBeInTheDocument()
  expect(screen.getByText(/Select a story from your shelf/i)).toBeInTheDocument()
})
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```
Expected: all pass

- [ ] **Step 5: Start dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:
- Dark `#0F0F12` background renders
- Left panel shows "◆ Inkwell" wordmark
- Empty shelf shows dashed violet border with "Create your first story"
- Main stage shows ghosted book and "Select a story from your shelf"
- "+ New Story" button at panel bottom opens the generation overlay
- Overlay shows the form with Genre/Characters/Setting fields and a violet Generate button
- Clicking the backdrop dismisses the overlay

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx .gitignore
git commit -m "feat: wire all components and hooks into Inkwell app shell"
```
