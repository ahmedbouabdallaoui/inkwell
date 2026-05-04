import { render, screen } from '@testing-library/react'
import { LeftPanel } from './LeftPanel'

const noop = vi.fn()

test('renders Wordmark, ChallengeCard, and BookShelf', () => {
  render(
    <LeftPanel
      books={[]}
      selectedBookId={null}
      onSelectBook={noop}
      onNewStory={noop}
      challenge={{ id: 'c1', prompt: 'A letter never sent.', date: '2026-05-04', streakCount: 3 }}
      challengeAccepted={false}
      onAcceptChallenge={noop}
      onWriteNow={noop}
    />
  )
  expect(screen.getByText('Inkwell')).toBeInTheDocument()
  expect(screen.getByText(/A letter never sent/)).toBeInTheDocument()
  expect(screen.getByText(/Create your first story/i)).toBeInTheDocument()
})
