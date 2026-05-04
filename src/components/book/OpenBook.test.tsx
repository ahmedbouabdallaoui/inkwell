import { render, screen } from '@testing-library/react'
import { OpenBook } from './OpenBook'
import type { Book } from '../../types'

test('shows empty state when no book is selected', () => {
  render(<OpenBook book={null} onPdfExport={vi.fn()} onShare={vi.fn()} />)
  expect(screen.getByText(/Select a story from your shelf/i)).toBeInTheDocument()
})

const book: Book = {
  id: '1', title: 'The Dragon Wakes', genre: 'Fantasy',
  characters: 'Arin', setting: 'Empire', coverImageUrl: 'c.jpg',
  pages: ['Page one content', 'Page two content', 'Page three content'],
  createdAt: '2026-05-04T00:00:00Z', userId: 'u1',
}

test('shows book title and first page content when a book is open', () => {
  render(<OpenBook book={book} onPdfExport={vi.fn()} onShare={vi.fn()} />)
  expect(screen.getByText('The Dragon Wakes')).toBeInTheDocument()
  expect(screen.getByText(/Page one content/)).toBeInTheDocument()
})

test('shows correct page counter', () => {
  render(<OpenBook book={book} onPdfExport={vi.fn()} onShare={vi.fn()} />)
  expect(screen.getByText('1 / 3')).toBeInTheDocument()
})
