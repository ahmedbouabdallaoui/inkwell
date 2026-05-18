import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerationOverlay } from './GenerationOverlay'

test('is not visible when open is false', () => {
  render(<GenerationOverlay open={false} onClose={vi.fn()} onSubmit={vi.fn()} loading={false} />)
  expect(screen.queryByText(/What will you write/i)).not.toBeInTheDocument()
})

test('is visible and shows Inkwell wordmark when open', () => {
  render(<GenerationOverlay open onClose={vi.fn()} onSubmit={vi.fn()} loading={false} />)
  expect(screen.getByText('Inkwell')).toBeInTheDocument()
  expect(screen.getByText(/What will you write/i)).toBeInTheDocument()
})

test('calls onClose when backdrop is clicked', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<GenerationOverlay open onClose={onClose} onSubmit={vi.fn()} loading={false} />)
  await user.click(screen.getByTestId('overlay-backdrop'))
  expect(onClose).toHaveBeenCalledOnce()
})
