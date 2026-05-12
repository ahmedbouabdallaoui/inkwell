import { ReactNode } from 'react'

interface Book3DProps {
  coverImageUrl: string
  title: string
  isOpen: boolean
  isOpening: boolean
  isClosing: boolean
  onOpen: () => void
  children: ReactNode
}

export function Book3D({ coverImageUrl, title, isOpen, isOpening, isClosing, onOpen, children }: Book3DProps) {
  const showOpen = isOpen && !isClosing

  const bodyClass = [
    'book-3d-body',
    showOpen ? 'book-3d-body--open' : 'book-3d-body--closed',
  ].join(' ')

  const coverClass = [
    'book-3d-cover',
    isOpening                            ? 'book-3d-cover--opening' : '',
    showOpen && !isOpening               ? 'book-3d-cover--open'    : '',
    isClosing                            ? 'book-3d-cover--closing' : '',
    !isOpen && !isOpening && !isClosing  ? 'book-3d-cover--closed'  : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="book-3d-scene">
      <div className={bodyClass}>
        {/* Interior — paper background; FlipBook mounts here when open */}
        <div className="book-3d-interior">
          {showOpen && children}
          {!showOpen && !isOpening && (
            <div className="book-3d-closed-right">
              <span style={{ color: '#8B6FE8', fontSize: 18, opacity: 0.45 }}>◆</span>
              <span style={{ fontFamily: 'Lora, serif', fontSize: 12, color: 'rgba(44,36,22,0.38)', fontStyle: 'italic' }}>
                {title}
              </span>
            </div>
          )}
        </div>

        {/* Spine — left edge, visible in 3D tilt */}
        <div className="book-3d-spine" aria-hidden />

        {/* Page-edge stack — right side, visible only when closed */}
        {!showOpen && <div className="book-3d-pages-edge" aria-hidden />}

        {/* Front cover — rotates open on click */}
        {!showOpen ? (
          <button
            className={coverClass}
            onClick={onOpen}
            aria-label="Open book"
          >
            <img
              src={coverImageUrl}
              alt={`${title} cover`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {!isOpening && (
              <div className="book-3d-cover-hint">
                <span>Click to open</span>
              </div>
            )}
          </button>
        ) : (
          /* Cover stays visually behind when open (rotated to -180°) */
          <div className={coverClass} aria-hidden />
        )}
      </div>
    </div>
  )
}
