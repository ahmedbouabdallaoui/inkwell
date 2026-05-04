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
