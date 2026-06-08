import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Book3D } from './Book3D'

const defaultProps = {
  coverImageUrl: 'https://example.com/cover.jpg',
  title: 'The Dragon Wakes',
  isOpen: false,
  isOpening: false,
  isClosing: false,
  isFlipping: false,
  onOpen: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

test('renders cover image when closed', () => {
  render(<Book3D {...defaultProps}><div>pages</div></Book3D>)
  expect(screen.getByRole('img', { name: 'The Dragon Wakes cover' })).toBeInTheDocument()
})

test('shows click-to-open hint when closed', () => {
  render(<Book3D {...defaultProps}><div>pages</div></Book3D>)
  expect(screen.getByText(/Click to open/i)).toBeInTheDocument()
})

test('calls onOpen when cover is clicked while closed', async () => {
  const user = userEvent.setup()
  const onOpen = vi.fn()
  render(<Book3D {...defaultProps} onOpen={onOpen}><div>pages</div></Book3D>)
  await user.click(screen.getByRole('button', { name: /Open book/i }))
  expect(onOpen).toHaveBeenCalledOnce()
})

test('renders children when isOpen is true', () => {
  render(<Book3D {...defaultProps} isOpen><div data-testid="pages">pages</div></Book3D>)
  expect(screen.getByTestId('pages')).toBeInTheDocument()
})

test('does not render children when isOpen is false', () => {
  render(<Book3D {...defaultProps} isOpen={false}><div data-testid="pages">pages</div></Book3D>)
  expect(screen.queryByTestId('pages')).not.toBeInTheDocument()
})

test('does not call onOpen when already open', async () => {
  const onOpen = vi.fn()
  render(<Book3D {...defaultProps} isOpen isFlipping={false} onOpen={onOpen}><div>pages</div></Book3D>)
  // cover should not be clickable when open
  expect(screen.queryByRole('button', { name: /Open book/i })).not.toBeInTheDocument()
})
