import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChallengeCard } from './ChallengeCard'

const defaultProps = {
  prompt: 'Write about a letter never sent.',
  streakCount: 7,
  onAccept: vi.fn(),
  onWriteNow: vi.fn(),
  accepted: false,
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('shows prompt teaser and streak count', () => {
  render(<ChallengeCard {...defaultProps} />)
  expect(screen.getByText(/Write about a letter/)).toBeInTheDocument()
  expect(screen.getByText('7')).toBeInTheDocument()
})

test('calls onAccept when Accept Challenge is clicked', async () => {
  const user = userEvent.setup()
  render(<ChallengeCard {...defaultProps} />)
  await user.click(screen.getByRole('button', { name: /Accept Challenge/i }))
  expect(defaultProps.onAccept).toHaveBeenCalledOnce()
})

test('shows Write Now button when accepted', () => {
  render(<ChallengeCard {...defaultProps} accepted />)
  expect(screen.getByRole('button', { name: /Write Now/i })).toBeInTheDocument()
})

test('calls onWriteNow when Write Now is clicked', async () => {
  const user = userEvent.setup()
  render(<ChallengeCard {...defaultProps} accepted />)
  await user.click(screen.getByRole('button', { name: /Write Now/i }))
  expect(defaultProps.onWriteNow).toHaveBeenCalledOnce()
})
