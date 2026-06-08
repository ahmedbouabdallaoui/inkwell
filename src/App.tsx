import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { CognitoProvider } from './auth/CognitoProvider'
import { useAuth } from './auth/useAuth'
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
  const { user, loading, login } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-ink-bg">
        <p className="font-mono text-sm text-ink-muted animate-pulse">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-ink-bg">
        <h1 className="font-display text-4xl tracking-tight text-ink-violet">Inkwell</h1>
        <p className="font-mono text-sm text-ink-muted -mt-4">AI story prompt generator</p>
        <button
          onClick={login}
          className="rounded-md bg-ink-violet px-6 py-2 font-mono text-sm text-white transition hover:bg-ink-violet-light"
        >
          Sign in with Cognito
        </button>
      </div>
    )
  }
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [challengeAccepted, setChallengeAccepted] = useState(false)
  const [overlayInitialValues, setOverlayInitialValues] = useState<Partial<GenerationInput> | undefined>()
  const [editSignal, setEditSignal] = useState(0)
  const [generationError, setGenerationError] = useState<string | null>(null)

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

  function handleGenerate(input: GenerationInput) {
    setGenerationError(null)
    generation.mutate(input, {
      onError: (err) => setGenerationError(err instanceof Error ? err.message : 'Generation failed'),
    })
  }

  function handlePdfExport() {
    if (!selectedBook) return
    const win = window.open('', '_blank')
    pdfExport.mutateAsync(selectedBook.id).then((url) => {
      if (win && !win.closed) {
        win.location.href = url
      } else {
        window.location.href = url
      }
    }).catch(() => {
      if (win && !win.closed) win.close()
    })
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
            onClose={() => { setOverlayOpen(false); setGenerationError(null) }}
            onSubmit={handleGenerate}
            loading={generation.isPending}
            initialValues={overlayInitialValues}
            error={generationError}
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
