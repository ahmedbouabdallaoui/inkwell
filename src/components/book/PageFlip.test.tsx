import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PageFlip } from './PageFlip'

const defaultProps = {
  onFlipForward: vi.fn(),
  onFlipBack: vi.fn(),
  canFlipForward: true,
  canFlipBack: true,
  children: <div>Page content</div>,
}

test('renders children', () => {
  render(<PageFlip {...defaultProps} />)
  expect(screen.getByText('Page content')).toBeInTheDocument()
})

test('calls onFlipForward when right edge is clicked', async () => {
  const user = userEvent.setup()
  const onFlipForward = vi.fn()
  render(<PageFlip {...defaultProps} onFlipForward={onFlipForward} />)
  await user.click(screen.getByRole('button', { name: /next page/i }))
  await waitFor(() => expect(onFlipForward).toHaveBeenCalledOnce(), { timeout: 1000 })
})

test('calls onFlipBack when left edge is clicked', async () => {
  const user = userEvent.setup()
  const onFlipBack = vi.fn()
  render(<PageFlip {...defaultProps} onFlipBack={onFlipBack} />)
  await user.click(screen.getByRole('button', { name: /previous page/i }))
  await waitFor(() => expect(onFlipBack).toHaveBeenCalledOnce(), { timeout: 1000 })
})

test('forward button is disabled when canFlipForward is false', () => {
  render(<PageFlip {...defaultProps} canFlipForward={false} />)
  expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled()
})

test('back button is disabled when canFlipBack is false', () => {
  render(<PageFlip {...defaultProps} canFlipBack={false} />)
  expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled()
})
