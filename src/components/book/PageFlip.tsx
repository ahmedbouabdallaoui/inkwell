import { useState, ReactNode } from 'react'

interface PageFlipProps {
  children: ReactNode
  onFlipForward: () => void
  onFlipBack: () => void
  canFlipForward: boolean
  canFlipBack: boolean
}

export function PageFlip({ children, onFlipForward, onFlipBack, canFlipForward, canFlipBack }: PageFlipProps) {
  const [animating, setAnimating] = useState(false)

  function handleFlip(direction: 'forward' | 'back') {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      direction === 'forward' ? onFlipForward() : onFlipBack()
      setAnimating(false)
    }, 400)
  }

  return (
    <div className="relative w-1/2 h-full overflow-hidden" style={{ perspective: 1200 }}>
      {/* Page content */}
      <div className={`w-full h-full ${animating ? 'page-flip-out' : ''}`}
           style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}>
        {children}
      </div>

      {/* Left edge click zone — go back */}
      <button
        onClick={() => handleFlip('back')}
        disabled={!canFlipBack || animating}
        aria-label="Previous page"
        className="absolute left-0 top-0 w-8 h-full z-10 cursor-w-resize disabled:cursor-default opacity-0"
      />

      {/* Right edge click zone — go forward */}
      <button
        onClick={() => handleFlip('forward')}
        disabled={!canFlipForward || animating}
        aria-label="Next page"
        className="absolute right-0 top-0 w-8 h-full z-10 cursor-e-resize disabled:cursor-default opacity-0"
      />
    </div>
  )
}
