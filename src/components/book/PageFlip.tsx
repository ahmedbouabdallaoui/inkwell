import { ReactNode } from 'react'

interface PageFlipProps {
  children: ReactNode
  onFlipForward: () => void
  onFlipBack: () => void
  canFlipForward: boolean
  canFlipBack: boolean
}

export function PageFlip({ children, onFlipForward, onFlipBack, canFlipForward, canFlipBack }: PageFlipProps) {
  return (
    <div className="relative w-1/2 h-full">
      {children}
      <button onClick={onFlipBack} disabled={!canFlipBack} aria-label="Previous page" className="absolute left-0 top-0 w-8 h-full opacity-0" />
      <button onClick={onFlipForward} disabled={!canFlipForward} aria-label="Next page" className="absolute right-0 top-0 w-8 h-full opacity-0" />
    </div>
  )
}
