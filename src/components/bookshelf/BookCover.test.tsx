import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookCover } from './BookCover'

const book = { id: '1', title: 'The Dragon Wakes', coverImageUrl: 'https://example.com/cover.jpg', isFavourite: false }
const noop = vi.fn()
const defaultProps = { book, onSelect: noop, isSelected: false, onEdit: noop, onDelete: noop, onFavourite: noop }

beforeEach(() => vi.clearAllMocks())

test('renders book cover image with alt text', () => {
  render(<BookCover {...defaultProps} />)
  expect(screen.getByRole('img', { name: 'The Dragon Wakes cover' })).toBeInTheDocument()
})

test('calls onSelect when spine is clicked', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  render(<BookCover {...defaultProps} onSelect={onSelect} />)
  await user.click(screen.getByRole('button', { name: /Open The Dragon Wakes/i }))
  expect(onSelect).toHaveBeenCalledWith('1')
})

test('calls onEdit when edit button is clicked', async () => {
  const user = userEvent.setup()
  const onEdit = vi.fn()
  render(<BookCover {...defaultProps} onEdit={onEdit} />)
  await user.click(screen.getByRole('button', { name: /Edit book/i }))
  expect(onEdit).toHaveBeenCalledWith('1')
})

test('calls onDelete when delete button is clicked', async () => {
  const user = userEvent.setup()
  const onDelete = vi.fn()
  render(<BookCover {...defaultProps} onDelete={onDelete} />)
  await user.click(screen.getByRole('button', { name: /Delete book/i }))
  expect(onDelete).toHaveBeenCalledWith('1')
})

test('calls onFavourite when favourite button is clicked', async () => {
  const user = userEvent.setup()
  const onFavourite = vi.fn()
  render(<BookCover {...defaultProps} onFavourite={onFavourite} />)
  await user.click(screen.getByRole('button', { name: /Favourite/i }))
  expect(onFavourite).toHaveBeenCalledWith('1')
})
