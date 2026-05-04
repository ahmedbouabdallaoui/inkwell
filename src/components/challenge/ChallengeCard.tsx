interface ChallengeCardProps {
  prompt: string
  streakCount: number
  accepted: boolean
  onAccept: () => void
  onWriteNow: () => void
}

export function ChallengeCard({ prompt, streakCount, accepted, onAccept, onWriteNow }: ChallengeCardProps) {
  return (
    <div className="mx-3 mt-3 rounded-lg border border-ink-violet bg-ink-raised p-4"
         style={{ boxShadow: '0 0 12px rgba(139,111,232,0.2)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-sans font-medium text-ink-muted uppercase tracking-widest">
          Daily Challenge
        </span>
        <span className="flex items-center gap-1 font-mono text-sm text-ink-text">
          🔥 <span>{streakCount}</span>
        </span>
      </div>

      <p className="text-sm font-sans text-ink-text leading-relaxed mb-3 line-clamp-2">
        {prompt}
      </p>

      {!accepted ? (
        <button
          onClick={onAccept}
          className="w-full rounded-md bg-ink-violet py-1.5 text-sm font-sans font-medium text-white hover:opacity-90 transition-opacity"
        >
          Accept Challenge
        </button>
      ) : (
        <button
          onClick={onWriteNow}
          className="w-full rounded-md border border-ink-violet py-1.5 text-sm font-sans font-medium text-ink-violet hover:bg-ink-violet/10 transition-colors"
        >
          Write Now
        </button>
      )}
    </div>
  )
}
