import { useRef, useEffect } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { BookPage } from './BookPage'
import type { Book } from '../../types'

interface FlipBookProps {
  book: Book
  onPageChange: (flipPageIndex: number) => void
}

export function FlipBook({ book, onPageChange }: FlipBookProps) {
  const bookRef = useRef<any>(null)

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') bookRef.current?.pageFlip()?.flipNext()
      if (e.key === 'ArrowLeft')  bookRef.current?.pageFlip()?.flipPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Pages array: [title, ...story pages, (blank if needed for even pairing)]
  const storyPages = book.pages
  const needsBlank = storyPages.length % 2 === 0  // odd total pages after title → needs blank

  return (
    <HTMLFlipBook
      width={360}
      height={500}
      size="fixed"
      drawShadow
      flippingTime={700}
      useMouseEvents
      usePortrait={false}
      startPage={0}
      ref={bookRef}
      onFlip={(e: any) => onPageChange(e.data)}
      style={{}}
      className=""
      startZIndex={0}
      autoSize={false}
      maxShadowOpacity={0.5}
      showCover={false}
      mobileScrollSupport={false}
      clickEventForward={false}
      swipeDistance={30}
      showPageCorners
      disableFlipByClick
    >
      {/* Page 0 (left): Title page */}
      <div
        className="flip-page"
        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
      >
        <BookPage
          side="left"
          title={book.title}
          genre={book.genre}
          createdAt={book.createdAt}
          content=""
        />
      </div>

      {/* Pages 1…N: story content, alternating left/right */}
      {storyPages.map((content, i) => (
        <div
          key={i}
          className="flip-page"
          onClick={() => {
            // Page index in FlipBook is i + 1
            // Even FlipBook index = left page → go back
            // Odd FlipBook index  = right page → go forward
            const flipIdx = i + 1
            if (flipIdx % 2 === 0) bookRef.current?.pageFlip()?.flipPrev()
            else                   bookRef.current?.pageFlip()?.flipNext()
          }}
        >
          <BookPage side="right" content={content} />
        </div>
      ))}

      {/* Blank page when needed so the last story page isn't alone on the right */}
      {needsBlank && (
        <div className="flip-page" onClick={() => bookRef.current?.pageFlip()?.flipPrev()}>
          <div style={{ width: '100%', height: '100%', background: '#F5EDD9' }} />
        </div>
      )}
    </HTMLFlipBook>
  )
}
