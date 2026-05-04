import { motion } from 'framer-motion'
import type { Book } from '../../types'

interface BookCoverProps {
  book: Pick<Book, 'id' | 'title' | 'coverImageUrl'>
  onSelect: (id: string) => void
  isSelected: boolean
}

export function BookCover({ book, onSelect, isSelected }: BookCoverProps) {
  return (
    <motion.button
      layoutId={`book-cover-${book.id}`}
      onClick={() => onSelect(book.id)}
      className="relative w-full aspect-[2/3] rounded-sm overflow-hidden focus:outline-none"
      whileHover={{ scale: 1.04, rotate: 0 }}
      initial={{ rotate: -1 }}
      animate={isSelected ? { scale: 1.08, rotate: 0 } : { rotate: -1 }}
      style={isSelected ? { boxShadow: '0 0 0 2px rgba(139,111,232,0.7)' } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <img
        src={book.coverImageUrl}
        alt={`${book.title} cover`}
        className="w-full h-full object-cover"
      />
      {isSelected && (
        <div className="absolute inset-0 rounded-sm"
             style={{ boxShadow: 'inset 0 0 0 2px rgba(139,111,232,0.5)' }} />
      )}
    </motion.button>
  )
}
