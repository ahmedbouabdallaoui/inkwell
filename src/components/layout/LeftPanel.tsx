import { Wordmark } from '../brand/Wordmark'
import { ChallengeCard } from '../challenge/ChallengeCard'
import { BookShelf } from '../bookshelf/BookShelf'
import type { Book, Challenge } from '../../types'

interface LeftPanelProps {
  books: Book[]
  selectedBookId: string | null
  onSelectBook: (id: string) => void
  onNewStory: () => void
  challenge: Challenge | null
  challengeAccepted: boolean
  onAcceptChallenge: () => void
  onWriteNow: () => void
}

export function LeftPanel({
  books, selectedBookId, onSelectBook, onNewStory,
  challenge, challengeAccepted, onAcceptChallenge, onWriteNow,
}: LeftPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-none border-b border-ink-border">
        <Wordmark />
      </div>

      {challenge && (
        <div className="flex-none">
          <ChallengeCard
            prompt={challenge.prompt}
            streakCount={challenge.streakCount}
            accepted={challengeAccepted}
            onAccept={onAcceptChallenge}
            onWriteNow={onWriteNow}
          />
        </div>
      )}

      <BookShelf
        books={books}
        selectedBookId={selectedBookId}
        onSelect={onSelectBook}
        onNewStory={onNewStory}
      />
    </div>
  )
}
