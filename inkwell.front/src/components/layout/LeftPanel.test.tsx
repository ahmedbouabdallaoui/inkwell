import { render, screen } from '@testing-library/react'
import { LeftPanel } from './LeftPanel'

const noop = vi.fn()
const panelProps = {
  books: [], selectedBookId: null,
  onSelectBook: noop, onNewStory: noop,
  challengeAccepted: false, onAcceptChallenge: noop, onWriteNow: noop,
  onEditBook: noop, onDeleteBook: noop, onFavouriteBook: noop,
}

test('renders Wordmark, ChallengeCard, and BookShelf', () => {
  render(
    <LeftPanel
      {...panelProps}
      challenge={{ id: 'c1', prompt: 'A letter never sent.', date: '2026-05-04', streakCount: 3 }}
    />
  )
  expect(screen.getByText('Inkwell')).toBeInTheDocument()
  expect(screen.getByText(/A letter never sent/)).toBeInTheDocument()
  expect(screen.getByText(/Create your first story/i)).toBeInTheDocument()
})
