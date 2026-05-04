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
  const [selectedBookId,       setSelectedBookId]       = useState<string | null>(null)
  const [overlayOpen,          setOverlayOpen]          = useState(false)
  const [challengeAccepted,    setChallengeAccepted]    = useState(false)
  const [overlayInitialValues, setOverlayInitialValues] = useState<Partial<GenerationInput> | undefined>()

  const { data: books = []  } = useBooks()
  const { data: challenge   } = useChallenge()
  const generation             = useGeneration()
  const pdfExport              = usePdfExport()

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
