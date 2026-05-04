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
