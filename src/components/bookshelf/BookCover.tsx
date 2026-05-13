import type { Book } from '../../types'

function getSpineColors(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  const hue = Math.abs(h) % 360
  return {
    bg: `hsl(${hue}, 22%, 14%)`,
    titleColor: `hsl(${hue}, 30%, 70%)`,
  }
}

interface BookCoverProps {
  book: Pick<Book, 'id' | 'title' | 'coverImageUrl' | 'isFavourite'>
  onSelect: (id: string) => void
  isSelected: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onFavourite: (id: string) => void
}

export function BookCover({ book, onSelect, isSelected, onEdit, onDelete, onFavourite }: BookCoverProps) {
  const { bg, titleColor } = getSpineColors(book.id)

  return (
    <div className="book-container">
      <button
        onClick={() => onSelect(book.id)}
        className={`spine-book ${isSelected ? 'spine-selected' : ''}`}
        aria-label={`Open ${book.title}`}
      >
        <div className="spine-inner">
          <div className="spine-face spine-front" style={{ background: bg }}>
            <div className="spine-ornament" />
            <span className="spine-title" style={{ color: titleColor }}>{book.title}</span>
            <div className="spine-ornament bottom" />
          </div>
          <div className="spine-face spine-back">
            <img src={book.coverImageUrl} alt={`${book.title} cover`} />
          </div>
        </div>
      </button>

      {/* Action icons — pill group pops below on hover */}
      <div className="book-actions">
        <button
          className={`book-action-btn book-action-fav ${book.isFavourite ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onFavourite(book.id) }}
          aria-label={book.isFavourite ? 'Unfavourite' : 'Favourite'}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill={book.isFavourite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button
          className="book-action-btn"
          onClick={(e) => { e.stopPropagation(); onEdit(book.id) }}
          aria-label="Edit book"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          className="book-action-btn book-action-delete"
          onClick={(e) => { e.stopPropagation(); onDelete(book.id) }}
          aria-label="Delete book"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
