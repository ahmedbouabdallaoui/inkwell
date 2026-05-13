import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookShelf } from './BookShelf'
import type { Book } from '../../types'

const noop = vi.fn()
const shelfProps = { selectedBookId: null, onSelect: noop, onNewStory: noop, onEdit: noop, onDelete: noop, onFavourite: noop }

const books: Book[] = [
  { id: '1', title: 'Book One', genre: 'Fantasy', characters: '', setting: '', coverImageUrl: 'a.jpg', pages: [], createdAt: '', userId: 'u1' },
  { id: '2', title: 'Book Two', genre: 'Sci-Fi',  characters: '', setting: '', coverImageUrl: 'b.jpg', pages: [], createdAt: '', userId: 'u1' },
]

test('renders all book covers', () => {
  render(<BookShelf books={books} {...shelfProps} />)
  expect(screen.getByRole('img', { name: 'Book One cover' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Book Two cover' })).toBeInTheDocument()
})

test('shows empty shelf slot when no books', () => {
  render(<BookShelf books={[]} {...shelfProps} />)
  expect(screen.getByText(/Create your first story/i)).toBeInTheDocument()
})

test('calls onNewStory when New Story is clicked', async () => {
  const user = userEvent.setup()
  const onNewStory = vi.fn()
  render(<BookShelf books={books} {...shelfProps} onNewStory={onNewStory} />)
  await user.click(screen.getByRole('button', { name: /New Story/i }))
  expect(onNewStory).toHaveBeenCalledOnce()
})

test('shows pagination when books exceed one page', () => {
  const manyBooks: Book[] = Array.from({ length: 10 }, (_, i) => ({
    id: `b${i}`, title: `Book ${i}`, genre: 'Fantasy', characters: '',
    setting: '', coverImageUrl: 'x.jpg', pages: [], createdAt: '', userId: 'u1',
  }))
  render(<BookShelf books={manyBooks} {...shelfProps} />)
  expect(screen.getByRole('button', { name: /Next shelf page/i })).toBeInTheDocument()
})
