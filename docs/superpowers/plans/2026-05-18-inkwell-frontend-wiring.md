# Inkwell Frontend-Backend Wiring

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded mock data in React frontend with API calls to FastAPI backend, add missing backend endpoints.

**Architecture:** Add `isFavourite` to Book model + response schema, add PATCH/DELETE/PUT book endpoints, update frontend API layer with generation polling, wire App.tsx to hooks.

**Tech Stack:** FastAPI, SQLAlchemy, React 19, React Query, Axios

---

### Task 1: Backend — Book model + schema updates

**Files:**
- Modify: `inkwell.back/app/models/book.py`
- Modify: `inkwell.back/app/schemas/book.py`
- Modify: `inkwell.back/app/schemas/pdf.py`

- [ ] **Add `is_favourite` column to Book model**

In `inkwell.back/app/models/book.py`, add after `cover_image_url`:
```python
    is_favourite: Mapped[bool] = mapped_column(Boolean, default=False)
```
Add `Boolean` import to the sqlalchemy import line.

- [ ] **Update BookResponse schema**

In `inkwell.back/app/schemas/book.py`, add `userId` and `isFavourite` fields:
```python
    user_id: str = Field(serialization_alias="userId")
    is_favourite: bool = Field(False, serialization_alias="isFavourite")
```
Add `Boolean` to pydantic import if needed. Add `from pydantic import Field` if not already.

- [ ] **Fix PdfExportRequest validation alias**

In `inkwell.back/app/schemas/pdf.py`:
```python
class PdfExportRequest(BaseModel):
    book_id: str = Field(serialization_alias="bookId", validation_alias="bookId")
```

- [ ] **Commit**

```bash
git add inkwell.back/app/models/book.py inkwell.back/app/schemas/book.py inkwell.back/app/schemas/pdf.py
git commit -m "feat: add Book.isFavourite, BookResponse userId/isFavourite, fix PdfExportRequest alias"
```

---

### Task 2: Backend — Update + Delete + Favourite endpoints

**Files:**
- Modify: `inkwell.back/app/routes/books.py`

- [ ] **Add update, delete, favourite endpoints**

In `inkwell.back/app/routes/books.py`, add after the existing `get_book` route:

```python
from pydantic import BaseModel


class UpdateBookRequest(BaseModel):
    title: str | None = None
    pages: list[str] | None = None


@router.patch("/{book_id}")
async def update_book(
    book_id: str,
    body: UpdateBookRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookResponse:
    result = await db.execute(select(Book).where(Book.id == book_id, Book.user_id == user.id))
    book = result.scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    if body.title is not None:
        book.title = body.title
    if body.pages is not None:
        book.pages = body.pages
    await db.flush()
    await db.refresh(book)
    return BookResponse.model_validate(book)


@router.delete("/{book_id}", status_code=204)
async def delete_book(
    book_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Book).where(Book.id == book_id, Book.user_id == user.id))
    book = result.scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    await db.delete(book)
    await db.flush()


@router.put("/{book_id}/favourite")
async def toggle_favourite(
    book_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookResponse:
    result = await db.execute(select(Book).where(Book.id == book_id, Book.user_id == user.id))
    book = result.scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    book.is_favourite = not book.is_favourite
    await db.flush()
    await db.refresh(book)
    return BookResponse.model_validate(book)
```

- [ ] **Commit**

```bash
git add inkwell.back/app/routes/books.py
git commit -m "feat: add PATCH/DELETE book and PUT favourite endpoints"
```

---

### Task 3: Frontend — Update API layer

**Files:**
- Modify: `src/api/books.ts`
- Modify: `src/api/generation.ts`

- [ ] **Update books API**

Replace `src/api/books.ts`:
```typescript
import { apiClient } from './client'
import type { Book } from '../types'

interface BooksResponse {
  books: Book[]
  total: number
}

export const fetchBooks = () =>
  apiClient.get<BooksResponse>('/books').then((r) => r.data.books)

export const fetchBook = (id: string) =>
  apiClient.get<Book>(`/books/${id}`).then((r) => r.data)

export const updateBook = (id: string, data: { title?: string; pages?: string[] }) =>
  apiClient.patch<Book>(`/books/${id}`, data).then((r) => r.data)

export const deleteBook = (id: string) =>
  apiClient.delete(`/books/${id}`)

export const toggleFavourite = (id: string) =>
  apiClient.put<Book>(`/books/${id}/favourite`).then((r) => r.data)
```

- [ ] **Rewrite generation API with polling**

Replace `src/api/generation.ts`:
```typescript
import { apiClient } from './client'
import type { Book, GenerationInput } from '../types'

interface GenerationJobStatus {
  jobId: string
  status: string
  book?: Book
  error?: string
}

export const generateStory = async (input: GenerationInput): Promise<Book> => {
  const { data: job } = await apiClient.post<{ jobId: string }>('/generate', input)
  return new Promise((resolve, reject) => {
    const poll = setInterval(async () => {
      try {
        const { data } = await apiClient.get<GenerationJobStatus>(`/generate/${job.jobId}`)
        if (data.status === 'complete' && data.book) {
          clearInterval(poll)
          resolve(data.book)
        } else if (data.status === 'failed') {
          clearInterval(poll)
          reject(new Error(data.error ?? 'Generation failed'))
        }
      } catch (e) {
        clearInterval(poll)
        reject(e)
      }
    }, 2000)
  })
}
```

- [ ] **Commit**

```bash
git add src/api/books.ts src/api/generation.ts
git commit -m "feat: update API layer with polling generation and book mutations"
```

---

### Task 4: Frontend — Wire App.tsx to hooks

**Files:**
- Modify: `src/App.tsx`

- [ ] **Replace mock data with real hooks and API calls**

Replace `src/App.tsx` completely:

```typescript
import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { CognitoProvider } from './auth/CognitoProvider'
import { AppShell } from './components/layout/AppShell'
import { LeftPanel } from './components/layout/LeftPanel'
import { OpenBook } from './components/book/OpenBook'
import { GenerationOverlay } from './components/generation/GenerationOverlay'
import { useBooks, useInvalidateBooks } from './hooks/useBooks'
import { useChallenge } from './hooks/useChallenge'
import { useGeneration } from './hooks/useGeneration'
import { usePdfExport } from './hooks/usePdfExport'
import { updateBook, deleteBook, toggleFavourite } from './api/books'
import type { Book, GenerationInput } from './types'

const queryClient = new QueryClient()

function InkwellApp() {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [challengeAccepted, setChallengeAccepted] = useState(false)
  const [overlayInitialValues, setOverlayInitialValues] = useState<Partial<GenerationInput> | undefined>()
  const [editSignal, setEditSignal] = useState(0)

  const { data: booksData } = useBooks()
  const { data: challenge } = useChallenge()
  const generation = useGeneration()
  const pdfExport = usePdfExport()
  const invalidateBooks = useInvalidateBooks()

  const books = booksData ?? []
  const selectedBook: Book | null = books.find((b) => b.id === selectedBookId) ?? null

  useEffect(() => {
    if (generation.data) {
      setSelectedBookId(generation.data.id)
      setOverlayOpen(false)
    }
  }, [generation.data])

  useEffect(() => {
    document.title = selectedBook ? `Inkwell — ${selectedBook.title}` : 'Inkwell'
  }, [selectedBook])

  function handleGenerate(input: GenerationInput) { generation.mutate(input) }

  function handlePdfExport() {
    if (!selectedBook) return
    pdfExport.mutateAsync(selectedBook.id).then((url) => window.open(url, '_blank'))
  }

  function handleShare() {
    if (!selectedBook) return
    pdfExport.mutateAsync(selectedBook.id).then((url) => navigator.clipboard.writeText(url))
  }

  function handleWriteNow() {
    setOverlayInitialValues({ genre: '', characters: '', setting: challenge?.prompt ?? '' })
    setOverlayOpen(true)
  }

  function handleEditBook(id: string) {
    setSelectedBookId(id)
    setEditSignal((s) => s + 1)
  }

  async function handleDeleteBook(id: string) {
    await deleteBook(id)
    invalidateBooks()
    if (selectedBookId === id) setSelectedBookId(null)
  }

  async function handleFavouriteBook(id: string) {
    await toggleFavourite(id)
    invalidateBooks()
  }

  async function handleSaveBook(id: string, updates: { title: string; pages: string[] }) {
    await updateBook(id, updates)
    invalidateBooks()
  }

  function handleRegenerateCover(_id: string, _prompt: string) {
    console.log('Regenerate cover for', _id, 'with prompt:', _prompt)
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
            onEditBook={handleEditBook}
            onDeleteBook={handleDeleteBook}
            onFavouriteBook={handleFavouriteBook}
          />
        }
        mainStage={
          <OpenBook
            book={selectedBook}
            editSignal={editSignal}
            onPdfExport={handlePdfExport}
            onShare={handleShare}
            onSave={handleSaveBook}
            onRegenerateCover={handleRegenerateCover}
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

- [ ] **Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire App.tsx to useBooks, useChallenge, useGeneration hooks"
```

---

### Task 5: Delete template/ directory

- [ ] **Remove template/**

```bash
git rm -r template/
git commit -m "chore: remove standalone HTML prototype mockup"
```

---

### Task 6: Verify

- [ ] **Run backend tests**

```bash
docker run --rm -v "$PWD/inkwell.back":/app -w /app -e DATABASE_URL="sqlite+aiosqlite:///./test.db" python:3.12-slim bash -c "pip install -q -r requirements.txt aiosqlite && python -m pytest tests/ -v"
```
Expected: all tests pass

- [ ] **Check TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors
