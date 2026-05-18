import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OpenBook } from './OpenBook'
import type { Book } from '../../types'

vi.mock('react-pageflip', () => ({
  default: vi.fn(({ children }: any) => (
    <div data-testid="html-flip-book">{children}</div>
  )),
}))

const noop = vi.fn()
const defaultProps = {
  editSignal: 0,
  onPdfExport: noop,
  onShare: noop,
  onSave: noop,
  onRegenerateCover: noop,
}

test('shows empty state when no book is selected', () => {
  render(<OpenBook book={null} {...defaultProps} />)
  expect(screen.getByText(/Select a story from your shelf/i)).toBeInTheDocument()
})

const book: Book = {
  id: '1', title: 'The Dragon Wakes', genre: 'Fantasy',
  characters: 'Arin', setting: 'Empire', coverImageUrl: 'c.jpg',
  pages: ['Page one content', 'Page two content', 'Page three content'],
  createdAt: '2026-05-04T00:00:00Z', userId: 'u1',
}

test('shows closed cover with Open button when book is first selected', () => {
  render(<OpenBook book={book} {...defaultProps} />)
  expect(screen.getByRole('img', { name: 'The Dragon Wakes cover' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Open book/i })).toBeInTheDocument()
})

test('shows FlipBook after opening', async () => {
  const user = userEvent.setup()
  render(<OpenBook book={book} {...defaultProps} />)
  await user.click(screen.getByRole('button', { name: /Open book/i }))
  await waitFor(
    () => expect(screen.getByTestId('html-flip-book')).toBeInTheDocument(),
    { timeout: 1500 },
  )
})

test('enters edit mode when editSignal increments', () => {
  const { rerender } = render(<OpenBook book={book} {...defaultProps} editSignal={0} />)
  rerender(<OpenBook book={book} {...defaultProps} editSignal={1} />)
  expect(screen.getByPlaceholderText(/Describe a new cover image/i)).toBeInTheDocument()
})

test('calls onSave with updated title on save', async () => {
  const user = userEvent.setup()
  const onSave = vi.fn()
  const { rerender } = render(<OpenBook book={book} {...defaultProps} onSave={onSave} editSignal={0} />)
  rerender(<OpenBook book={book} {...defaultProps} onSave={onSave} editSignal={1} />)
  const input = screen.getByPlaceholderText(/Book title/i)
  await user.clear(input)
  await user.type(input, 'New Title')
  await user.click(screen.getByRole('button', { name: /Save/i }))
  expect(onSave).toHaveBeenCalledWith('1', expect.objectContaining({ title: 'New Title' }))
})
