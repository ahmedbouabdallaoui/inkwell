import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { CognitoProvider } from './auth/CognitoProvider'
import { AppShell } from './components/layout/AppShell'
import { LeftPanel } from './components/layout/LeftPanel'
import { OpenBook } from './components/book/OpenBook'
import { GenerationOverlay } from './components/generation/GenerationOverlay'
import { useGeneration } from './hooks/useGeneration'
import { usePdfExport } from './hooks/usePdfExport'
import type { Book, GenerationInput } from './types'

const queryClient = new QueryClient()

// TODO: remove hardcoded data once backend is wired
const INITIAL_BOOKS: Book[] = [
  {
    id: 'mock-1',
    title: "The Clockmaker's Daughter",
    genre: 'Fantasy',
    characters: 'Elara Windmere, Master Thorne',
    setting: 'The city of Chronos, suspended between heaven and earth',
    coverImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=280&h=420&fit=crop',
    pages: [
      `The city of Chronos hung between the gears of heaven and the springs of earth, suspended by brass chains that sang in the wind. Here, time was not merely measured — it was manufactured, poured into molten casings, and regulated by the Grand Clock that towered above the silver clouds.\n\nElara Windmere pressed her ear against the wall of her father's workshop, listening to the secret language of the pendulums. They spoke in rhythmic whispers, telling stories of moments that had never happened and futures that refused to unfold.`,
      `"You've heard the Forbidden Phrase," Thorne whispered. "No pendulum has spoken those words since the Collapse of '09, when the city nearly tore itself from its moorings."\n\nElara felt a chill that had nothing to do with the drafty workshop. He withdrew a key from beneath his shirt — a key made not of brass or iron, but of crystallized starlight that pulsed with its own heartbeat.`,
      `Before Elara could reach for the extraordinary device, the workshop's thirteen clocks struck simultaneously — not the hour, but a discordant alarm that made the brass instruments rattle on their shelves.\n\n"They've found us," Thorne said. "The Regulators. They've been hunting the Heart since your grandmother hid it."\n\nThe front door exploded inward in a shower of splinters and clockwork.`,
    ],
    createdAt: '2026-05-04T10:00:00Z',
    userId: 'demo',
  },
  {
    id: 'mock-2',
    title: 'Neon Drifter',
    genre: 'Cyberpunk',
    characters: 'Kael Vance, a courier',
    setting: 'District 9, a rain-soaked megacity',
    coverImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=280&h=420&fit=crop',
    pages: [
      `Rain fell upward in District 9, deflected by the atmospheric shields that kept the upper levels pristine. Kael Vance watched the inverted droplets through the cracked viewport of his hover-bike, each one catching the neon advertisements from below and turning them into brief, falling stars.\n\nHe was a drifter — a courier who specialized in deliveries that didn't exist on any network.`,
      `Inside was a seed.\n\nNot a data seed or an encryption key — an actual, physical seed, brown and wrinkled and impossibly old. When Kael touched it, a single clear voice spoke directly into his auditory cortex.\n\n"Find the garden," it said. "Before they pave over the last of it."`,
    ],
    createdAt: '2026-04-22T10:00:00Z',
    userId: 'demo',
  },
]

// Extra mock books to demonstrate shelf pagination (>8 triggers pagination)
const EXTRA_BOOKS: Book[] = [
  { id: 'mock-3', title: 'The Hollow Crown', genre: 'Horror', characters: 'Evelyn', setting: 'A cursed manor', coverImageUrl: 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?w=280&h=420&fit=crop', pages: [`The crown had been in Evelyn's family for eleven generations, passed down through whispers and warnings rather than celebration.`], createdAt: '2026-03-15T10:00:00Z', userId: 'demo' },
  { id: 'mock-4', title: 'Starlight Archives', genre: 'Science Fiction', characters: 'Dr. Yuki Tanaka', setting: 'A crystal archive at the edge of the Kepler Belt', coverImageUrl: 'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=280&h=420&fit=crop', pages: [`The Archive drifted at the edge of the Kepler Belt, a cathedral of crystal and memory that had been recording human civilization since the Exodus.`], createdAt: '2026-02-08T10:00:00Z', userId: 'demo' },
  { id: 'mock-5', title: 'The Ember Throne', genre: 'Fantasy', characters: 'Prince Davan', setting: 'A kingdom built on volcanic glass', coverImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=280&h=420&fit=crop', pages: [`The throne room was carved from a single block of obsidian, pulled from the heart of the Ashfall Volcano three hundred years ago.`], createdAt: '2026-01-20T10:00:00Z', userId: 'demo' },
  { id: 'mock-6', title: 'Rust and Rain', genre: 'Post-Apocalyptic', characters: 'Mara, a scavenger', setting: 'The flooded ruins of New Shanghai', coverImageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=280&h=420&fit=crop', pages: [`Mara had learned to read the water. Not the surface, which lied, but the deep slow pull beneath it that remembered what the city used to be.`], createdAt: '2026-01-05T10:00:00Z', userId: 'demo' },
  { id: 'mock-7', title: 'The Glass Surgeon', genre: 'Thriller', characters: 'Dr. Hesse', setting: 'A private hospital in Vienna, 1913', coverImageUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=280&h=420&fit=crop', pages: [`The patient had no name, no past, and according to the records that didn't exist, no future. Dr. Hesse had performed stranger operations.`], createdAt: '2025-12-18T10:00:00Z', userId: 'demo' },
  { id: 'mock-8', title: 'Voices in the Static', genre: 'Mystery', characters: 'Radio operator Sable', setting: 'A remote Arctic research station', coverImageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=280&h=420&fit=crop', pages: [`The signal came through on a frequency that hadn't been used since 1947. Sable pulled off her headphones and stared at the waveform on the screen.`], createdAt: '2025-12-01T10:00:00Z', userId: 'demo' },
  { id: 'mock-9', title: 'The Salt Cartographer', genre: 'Adventure', characters: 'Captain Lira', setting: 'The Uncharted Salt Sea', coverImageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=280&h=420&fit=crop', pages: [`No map had ever correctly shown the Salt Sea twice. The sea moved. The islands moved. Even the horizon, on bad days, seemed to move.`], createdAt: '2025-11-14T10:00:00Z', userId: 'demo' },
  { id: 'mock-10', title: 'Dream Architecture', genre: 'Surreal Fiction', characters: 'The Builder', setting: 'A city that exists only during sleep', coverImageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=280&h=420&fit=crop', pages: [`Every night the city appeared. Every morning it was gone. Only the Builder remembered it, and only because she never slept the same way twice.`], createdAt: '2025-10-30T10:00:00Z', userId: 'demo' },
  { id: 'mock-11', title: 'The Bone Librarian', genre: 'Dark Fantasy', characters: 'Ossian, a keeper of the dead', setting: 'The Great Library of Remains', coverImageUrl: 'https://images.unsplash.com/photo-1436891678271-9c672565d8f6?w=280&h=420&fit=crop', pages: [`Every skull in the Library told a story. Ossian's job was to listen. The hard part was knowing when to stop.`], createdAt: '2025-10-10T10:00:00Z', userId: 'demo' },
]

// TODO: remove hardcoded challenge once backend is wired
const MOCK_CHALLENGE = { id: 'c1', prompt: 'Write about a clock that counts down to something other than time.', date: '2026-05-05', streakCount: 12 }

function InkwellApp() {
  const [books,             setBooks]             = useState<Book[]>([...INITIAL_BOOKS, ...EXTRA_BOOKS])
  const [selectedBookId,    setSelectedBookId]    = useState<string | null>(null)
  const [overlayOpen,       setOverlayOpen]       = useState(false)
  const [challengeAccepted, setChallengeAccepted] = useState(false)
  const [overlayInitialValues, setOverlayInitialValues] = useState<Partial<GenerationInput> | undefined>()
  const [editSignal,        setEditSignal]        = useState(0)

  const challenge  = MOCK_CHALLENGE
  const generation = useGeneration()
  const pdfExport  = usePdfExport()

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
    setOverlayInitialValues({ genre: '', characters: '', setting: challenge.prompt })
    setOverlayOpen(true)
  }

  // Book actions
  function handleEditBook(id: string) {
    setSelectedBookId(id)
    setEditSignal((s) => s + 1)
  }

  function handleDeleteBook(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id))
    if (selectedBookId === id) setSelectedBookId(null)
  }

  function handleFavouriteBook(id: string) {
    setBooks((prev) => prev.map((b) => b.id === id ? { ...b, isFavourite: !b.isFavourite } : b))
  }

  function handleSaveBook(id: string, updates: { title: string; pages: string[] }) {
    setBooks((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } : b))
  }

  function handleRegenerateCover(_id: string, _prompt: string) {
    // TODO: call backend cover regeneration endpoint
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
            challenge={challenge}
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
