import { useState, ReactNode } from 'react'

interface PageFlipProps {
  children: ReactNode
  onFlipForward: () => void
  onFlipBack: () => void
  canFlipForward: boolean
  canFlipBack: boolean
}

export function PageFlip({ children, onFlipForward, onFlipBack, canFlipForward, canFlipBack }: PageFlipProps) {
  const [phase, setPhase] = useState<'idle' | 'flipping-out' | 'flipping-in'>('idle')

  function handleFlip(direction: 'forward' | 'back') {
    if (phase !== 'idle') return
    setPhase('flipping-out')
    setTimeout(() => {
      direction === 'forward' ? onFlipForward() : onFlipBack()
      setPhase('flipping-in')
      setTimeout(() => setPhase('idle'), 200)
    }, 200)
  }

  const contentClass = [
    'w-full h-full',
    phase === 'flipping-out' ? 'page-flip-out' : '',
    phase === 'flipping-in'  ? 'page-flip-in'  : '',
  ].join(' ')

  return (
    <div className="relative w-1/2 h-full overflow-hidden" style={{ perspective: 1200 }}>
      <div className={contentClass}
           style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}>
        {children}
      </div>

      <button
        onClick={() => handleFlip('back')}
        disabled={!canFlipBack || phase !== 'idle'}
        aria-label="Previous page"
        className="absolute left-0 top-0 w-8 h-full z-10 cursor-pointer disabled:cursor-default opacity-0"
      />

      <button
        onClick={() => handleFlip('forward')}
        disabled={!canFlipForward || phase !== 'idle'}
        aria-label="Next page"
        className="absolute right-0 top-0 w-8 h-full z-10 cursor-pointer disabled:cursor-default opacity-0"
      />
    </div>
  )
}
