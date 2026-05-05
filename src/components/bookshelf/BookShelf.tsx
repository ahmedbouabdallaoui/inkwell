import { BookCover } from './BookCover'
import type { Book } from '../../types'

const PER_ROW = 4

interface BookShelfProps {
  books: Book[]
  selectedBookId: string | null
  onSelect: (id: string) => void
  onNewStory: () => void
}

export function BookShelf({ books, selectedBookId, onSelect, onNewStory }: BookShelfProps) {
  const rows: Book[][] = []
  for (let i = 0; i < books.length; i += PER_ROW) {
    rows.push(books.slice(i, i + PER_ROW))
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-[14px] py-2">
        {books.length === 0 ? (
          <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-ink-violet/50 mt-2">
            <span className="text-xs font-sans text-ink-muted text-center leading-relaxed px-4">
              + Create your first story
            </span>
          </div>
        ) : (
          rows.map((rowBooks, i) => (
            <div key={i} className="shelf-row">
              {rowBooks.map((book) => (
                <BookCover
                  key={book.id}
                  book={book}
                  onSelect={onSelect}
                  isSelected={selectedBookId === book.id}
                />
              ))}
            </div>
          ))
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
