import { useState, useEffect } from 'react'
import { Book3D } from './Book3D'
import { FlipBook } from './FlipBook'
import type { Book } from '../../types'

const MAX_REGEN = 3

interface OpenBookProps {
  book: Book | null
  editSignal: number
  onPdfExport: () => void
  onShare: () => void
  onSave: (id: string, updates: { title: string; pages: string[] }) => void
  onRegenerateCover: (id: string, prompt: string) => void
}

export function OpenBook({ book, editSignal, onPdfExport, onShare, onSave, onRegenerateCover }: OpenBookProps) {
  const [isOpen,        setIsOpen]        = useState(false)
  const [isOpening,     setIsOpening]     = useState(false)
  const [isClosing,     setIsClosing]     = useState(false)
  const [editMode,      setEditMode]      = useState(false)
  const [currentPage,   setCurrentPage]   = useState(0)  // FlipBook page index
  const [editedTitle,   setEditedTitle]   = useState('')
  const [editedPages,   setEditedPages]   = useState<string[]>([])
  const [coverPrompt,   setCoverPrompt]   = useState('')
  const [regenCount,    setRegenCount]    = useState(0)

  // Reset when a different book is selected
  useEffect(() => {
    setIsOpen(false)
    setIsOpening(false)
    setIsClosing(false)
    setEditMode(false)
    setCurrentPage(0)
  }, [book?.id])

  // Open in edit mode when the shelf ✎ icon is clicked
  useEffect(() => {
    if (editSignal > 0 && book) {
      setEditedTitle(book.title)
      setEditedPages([...book.pages])
      setCoverPrompt('')
      setRegenCount(0)
      openBook(true)
    }
  }, [editSignal])

  function openBook(inEditMode = false) {
    if (inEditMode) {
      // Skip animation for direct edit access from shelf
      setIsOpen(true)
      setIsOpening(false)
      setEditMode(true)
      return
    }
    setIsOpening(true)
    setTimeout(() => {
      setIsOpen(true)
      setIsOpening(false)
    }, 700)
  }

  function closeBook() {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      setEditMode(false)
      setCurrentPage(0)
    }, 700)
  }

  function enterEditMode() {
    if (!book) return
    setEditedTitle(book.title)
    setEditedPages([...book.pages])
    setCoverPrompt('')
    setRegenCount(0)
    setEditMode(true)
  }

  function saveEdit() {
    if (!book) return
    onSave(book.id, { title: editedTitle, pages: editedPages })
    setEditMode(false)
  }

  function handleRegen() {
    if (!book || regenCount >= MAX_REGEN) return
    onRegenerateCover(book.id, coverPrompt)
    setRegenCount((n) => n + 1)
  }

  // Toolbar page counter — FlipBook page 0 is title, 1…N are story pages
  const storyPageShown = Math.max(currentPage, 1)
  const totalStoryPages = book?.pages.length ?? 0
  const counterText = book
    ? currentPage === 0
      ? `Title · ${totalStoryPages} pages`
      : `${storyPageShown}–${Math.min(storyPageShown + 1, totalStoryPages)} / ${totalStoryPages}`
    : ''

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 text-ink-muted empty-float">
        <div style={{ width: 80, height: 110, border: '2px dashed #2E2E35', borderRadius: 4, opacity: 0.25, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, borderLeft: '1px dashed #2E2E35', opacity: 0.5 }} />
        </div>
        <p className="text-sm font-sans tracking-wide">Select a story from your shelf</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <Book3D
        coverImageUrl={book.coverImageUrl}
        title={book.title}
        isOpen={isOpen}
        isOpening={isOpening}
        isClosing={isClosing}
        onOpen={() => openBook()}
      >
        {editMode ? (
          /* ── Edit mode: textarea layout replaces FlipBook ── */
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            {/* Left page: title + cover regen */}
            <div style={{ width: '50%', height: '100%', background: '#F5EDD9', borderRight: '1px solid rgba(44,36,22,0.08)', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="book-regen-label">Title</p>
              <input
                className="book-edit-title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Book title…"
              />
              <p className="book-regen-label" style={{ marginTop: 8 }}>Regenerate Cover</p>
              <input
                className="book-regen-input"
                value={coverPrompt}
                onChange={(e) => setCoverPrompt(e.target.value)}
                placeholder="Describe a new cover image…"
              />
              <button className="book-regen-btn" onClick={handleRegen} disabled={regenCount >= MAX_REGEN}>
                Regenerate
              </button>
              <p className="book-regen-count">{regenCount} / {MAX_REGEN} attempts used</p>
            </div>
            {/* Right page: editable story content for current spread */}
            <div style={{ width: '50%', height: '100%', background: '#F5EDD9', padding: '32px 28px', display: 'flex', flexDirection: 'column' }}>
              <textarea
                className="book-edit-textarea"
                value={editedPages[Math.max(currentPage - 1, 0)] ?? ''}
                onChange={(e) => {
                  const idx = Math.max(currentPage - 1, 0)
                  setEditedPages((prev) => { const n = [...prev]; n[idx] = e.target.value; return n })
                }}
                placeholder="Page content…"
              />
            </div>
          </div>
        ) : (
          /* ── Reading mode: FlipBook ── */
          <FlipBook
            book={book}
            onPageChange={setCurrentPage}
          />
        )}
      </Book3D>

      {/* Table surface */}
      <div className="book-table-surface" />

      {/* Toolbar */}
      <div className="book-toolbar" style={{ marginTop: 0 }}>
        {editMode ? (
          <>
            <button className="book-toolbar-btn" onClick={saveEdit} style={{ color: '#8B6FE8' }}>✓ Save</button>
            <button className="book-toolbar-btn" onClick={() => setEditMode(false)}>✕ Cancel</button>
          </>
        ) : (
          <>
            {(isOpen && !isClosing) && (
              <button className="book-toolbar-btn" onClick={closeBook}>✕ Close</button>
            )}
            {(isOpen && !isClosing) && (
              <>
                <span style={{ color: '#2E2E35' }}>|</span>
                <span style={{ fontFamily: 'Inter Mono, monospace', fontSize: 12, color: '#8888A0' }}>
                  {counterText}
                </span>
                <button className="book-toolbar-btn" onClick={enterEditMode}>✎ Edit</button>
                <button className="book-toolbar-btn" onClick={onPdfExport}>PDF ↓</button>
                <button className="book-toolbar-btn" onClick={onShare}>Share ↗</button>
              </>
            )}
            {(!isOpen && !isOpening) && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#8888A0' }}>
                {book.genre} · {book.pages.length} pages
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
