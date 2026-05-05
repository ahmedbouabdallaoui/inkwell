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
  book: Pick<Book, 'id' | 'title' | 'coverImageUrl'>
  onSelect: (id: string) => void
  isSelected: boolean
}

export function BookCover({ book, onSelect, isSelected }: BookCoverProps) {
  const { bg, titleColor } = getSpineColors(book.id)

  return (
    <button
      onClick={() => onSelect(book.id)}
      className={`spine-book ${isSelected ? 'spine-selected' : ''}`}
      aria-label={`Open ${book.title}`}
    >
      <div className="spine-inner">
        {/* Spine face */}
        <div className="spine-face spine-front" style={{ background: bg }}>
          <div className="spine-ornament" />
          <span className="spine-title" style={{ color: titleColor }}>
            {book.title}
          </span>
          <div className="spine-ornament bottom" />
        </div>

        {/* Cover face (revealed on hover/select) */}
        <div className="spine-face spine-back">
          <img src={book.coverImageUrl} alt={`${book.title} cover`} />
        </div>
      </div>
    </button>
  )
}
