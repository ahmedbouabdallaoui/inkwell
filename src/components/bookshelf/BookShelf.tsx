import { useState } from 'react'
import { BookCover } from './BookCover'
import type { Book } from '../../types'

const PER_ROW  = 4
const PER_PAGE = 8

interface BookShelfProps {
  books: Book[]
  selectedBookId: string | null
  onSelect: (id: string) => void
  onNewStory: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onFavourite: (id: string) => void
}

export function BookShelf({ books, selectedBookId, onSelect, onNewStory, onEdit, onDelete, onFavourite }: BookShelfProps) {
  const [page, setPage] = useState(0)

  const totalPages   = Math.ceil(books.length / PER_PAGE)
  const visibleBooks = books.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  const rows: Book[][] = []
  for (let i = 0; i < visibleBooks.length; i += PER_ROW) {
    rows.push(visibleBooks.slice(i, i + PER_ROW))
  }

  return (
    <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
      <div
        className="flex-1 overflow-y-auto px-[14px] py-2 shelf-scroll"
        style={{ overflowX: 'visible', minHeight: 0 }}
      >
        {books.length === 0 ? (
          <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-ink-violet/50 mt-2">
            <span className="text-xs font-sans text-ink-muted text-center leading-relaxed px-4">
              + Create your first story
            </span>
          </div>
        ) : (
          <>
            {rows.map((rowBooks, i) => (
              <div key={i} className="shelf-row">
                {rowBooks.map((book) => (
                  <BookCover
                    key={book.id}
                    book={book}
                    onSelect={onSelect}
                    isSelected={selectedBookId === book.id}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onFavourite={onFavourite}
                  />
                ))}
              </div>
            ))}

            {totalPages > 1 && (
              <div className="shelf-pagination">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 0} aria-label="Previous shelf page">‹</button>
                <span>{page + 1} / {totalPages}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1} aria-label="Next shelf page">›</button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex-none px-[14px] pb-3 pt-2 border-t border-ink-border">
        <button
          onClick={onNewStory}
          className="w-full rounded-md border border-dashed border-ink-border py-2.5 text-sm font-sans text-ink-muted hover:text-ink-text hover:border-ink-violet/40 hover:bg-ink-violet/[0.04] transition-colors"
        >
          + New Story
        </button>
      </div>
    </div>
  )
}
