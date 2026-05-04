import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookCover } from './BookCover'

const book = {
  id: '1',
  title: 'The Dragon Wakes',
  coverImageUrl: 'https://example.com/cover.jpg',
}

test('renders book cover image with alt text', () => {
  render(<BookCover book={book} onSelect={vi.fn()} isSelected={false} />)
  expect(screen.getByRole('img', { name: 'The Dragon Wakes cover' })).toBeInTheDocument()
})

test('calls onSelect when clicked', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  render(<BookCover book={book} onSelect={onSelect} isSelected={false} />)
  await user.click(screen.getByRole('img', { name: 'The Dragon Wakes cover' }))
  expect(onSelect).toHaveBeenCalledWith('1')
})
