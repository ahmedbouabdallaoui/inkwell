import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerationForm } from './GenerationForm'

test('renders genre, characters, and setting fields', () => {
  render(<GenerationForm onSubmit={vi.fn()} loading={false} />)
  expect(screen.getByLabelText(/Genre/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Characters/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Setting/i)).toBeInTheDocument()
})

test('calls onSubmit with field values', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(<GenerationForm onSubmit={onSubmit} loading={false} />)
  await user.type(screen.getByLabelText(/Genre/i), 'Fantasy')
  await user.type(screen.getByLabelText(/Characters/i), 'A reluctant mage')
  await user.type(screen.getByLabelText(/Setting/i), 'A collapsing empire')
  await user.click(screen.getByRole('button', { name: /Generate/i }))
  expect(onSubmit).toHaveBeenCalledWith({
    genre: 'Fantasy',
    characters: 'A reluctant mage',
    setting: 'A collapsing empire',
  })
})

test('shows ink-drop loader and disables button when loading', () => {
  render(<GenerationForm onSubmit={vi.fn()} loading />)
  expect(screen.getByRole('button', { name: /Generate/i })).toBeDisabled()
})
