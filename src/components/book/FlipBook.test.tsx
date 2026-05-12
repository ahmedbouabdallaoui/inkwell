import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FlipBook } from './FlipBook'
import type { Book } from '../../types'

// react-pageflip uses HTML5 Canvas which jsdom doesn't support — mock it
vi.mock('react-pageflip', () => ({
  default: vi.fn(({ children, onFlip, ref: _ref }: any) => (
    <div data-testid="html-flip-book">{children}</div>
  )),
}))

const book: Book = {
  id: '1', title: 'The Dragon Wakes', genre: 'Fantasy',
  characters: 'Arin', setting: 'Empire', coverImageUrl: 'c.jpg',
  pages: ['Page one content.', 'Page two content.', 'Page three content.'],
  createdAt: '2026-05-04T00:00:00Z', userId: 'u1',
}

test('renders a page div for each story page plus the title page', () => {
  render(<FlipBook book={book} onPageChange={vi.fn()} />)
  // title page + 3 story pages = 4 flip-page divs (+ possibly 1 blank for even pairing)
  const pages = document.querySelectorAll('.flip-page')
  expect(pages.length).toBeGreaterThanOrEqual(4)
})

test('renders story content inside flip pages', () => {
  render(<FlipBook book={book} onPageChange={vi.fn()} />)
  expect(screen.getByText(/Page one content/)).toBeInTheDocument()
  expect(screen.getByText(/Page two content/)).toBeInTheDocument()
})

test('renders title and genre on the title page', () => {
  render(<FlipBook book={book} onPageChange={vi.fn()} />)
  expect(screen.getByText('The Dragon Wakes')).toBeInTheDocument()
  expect(screen.getByText('Fantasy')).toBeInTheDocument()
})
