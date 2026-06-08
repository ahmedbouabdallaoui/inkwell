import { useRef, useEffect } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { BookPage } from './BookPage'
import type { Book } from '../../types'
import React from 'react'

interface FlipBookProps {
  book: Book
  pages?: string[]
  onPageChange: (flipPageIndex: number) => void
  onRequestClose?: () => void
  onFlipStateChange?: (isFlipping: boolean) => void
}

export function FlipBook({ book, pages, onPageChange, onRequestClose, onFlipStateChange }: FlipBookProps) {
  const bookRef = useRef<any>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') bookRef.current?.pageFlip()?.flipNext()
      if (e.key === 'ArrowLeft') {
        const current = bookRef.current?.pageFlip()?.getCurrentPageIndex?.() ?? 0
        if (current === 0 && onRequestClose) {
          onRequestClose()
          return
        }
        bookRef.current?.pageFlip()?.flipPrev()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onRequestClose])

  function handlePrevOrClose() {
    const current = bookRef.current?.pageFlip()?.getCurrentPageIndex?.() ?? 0
    if (current === 0 && onRequestClose) {
      onRequestClose()
      return
    }
    bookRef.current?.pageFlip()?.flipPrev()
  }

  const storyPages = pages ?? book.pages

  // Pre-build the pages array — no conditional JSX children.
  // react-pageflip calls React.cloneElement on every child; if a child
  // evaluates to false/null (from a short-circuit expression), it throws.
  const flipPages: React.ReactElement[] = [
    <div key="title" className="flip-page" onClick={handlePrevOrClose}>
      <BookPage side="left" title={book.title} genre={book.genre} createdAt={book.createdAt} content="" />
    </div>,
    ...storyPages.map((content, i) => {
      const flipIdx = i + 1
      return (
        <div
          key={`page-${i}`}
          className="flip-page"
          onClick={() => {
            if (flipIdx % 2 === 0) bookRef.current?.pageFlip()?.flipPrev()
            else                   bookRef.current?.pageFlip()?.flipNext()
          }}
        >
          <BookPage side="right" content={content} />
        </div>
      )
    }),
  ]

  // Ensure even total page count so the last story page is never alone on the right
  if (storyPages.length % 2 === 0) {
    flipPages.push(
      <div key="blank" className="flip-page" onClick={handlePrevOrClose}>
        <div style={{ width: '100%', height: '100%', background: '#F5EDD9' }} />
      </div>
    )
  }

  return (
    <HTMLFlipBook
      width={360}
      height={500}
      minWidth={200}
      maxWidth={600}
      minHeight={300}
      maxHeight={800}
      size="fixed"
      drawShadow
      flippingTime={700}
      useMouseEvents
      usePortrait={false}
      startPage={0}
      ref={bookRef}
      onFlip={(e: any) => onPageChange(e.data)}
      onChangeState={(e: any) => onFlipStateChange?.(e.data === 'flipping')}
      style={{}}
      className=""
      startZIndex={0}
      autoSize={false}
      maxShadowOpacity={0.32}
      showCover={false}
      mobileScrollSupport={false}
      clickEventForward={false}
      swipeDistance={30}
      showPageCorners
      disableFlipByClick
    >
      {flipPages}
    </HTMLFlipBook>
  )
}
