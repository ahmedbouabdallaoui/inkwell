# 3D Book Experience — Design Spec

**Date:** 2026-05-12
**Scope:** Replace the current flat CSS book spread with a physically realistic 3D book using `page-flip` (StPageFlip) for curved page turns and CSS 3D transforms for the cover opening animation. Also fixes three bookshelf layout/UX issues.

---

## 1. Technology Choice

| Concern | Solution |
|---|---|
| Curved page-turn animation | `page-flip` npm library (~100 KB) — HTML5 Canvas arc drawn over HTML page divs |
| Cover opening / 3D book object | CSS `transform-style: preserve-3d` + `rotateY` on the cover panel |
| Page content (text, edit mode) | Native HTML divs inside StPageFlip pages — no canvas texturing |

**Why not Three.js:** ~600 KB bundle, requires canvas texturing (loses HTML editing), overkill for this use case.  
**Why not custom canvas:** Reimplements StPageFlip for no benefit.

---

## 2. 3D Book Object — DOM Structure

```
.book-3d-scene           ← perspective: 1400px; slight rotateY(-8deg) tilt when closed
  .book-3d-body          ← transform-style: preserve-3d; position: relative
    .book-spine          ← 20px wide, left edge, always visible, dark leather texture
    .book-cover          ← 360×500px front face; rotates around left edge (spine axis)
    .book-back-cover     ← rear face, dark
    .book-pages-edge     ← 18px wide, right edge, visible only in closed state
    .book-interior       ← 720×500px, revealed once cover is open; StPageFlip mounts here
```

**Closed tilt:** `rotateY(-8deg) rotateX(3deg)` on `.book-3d-scene` so the spine and page-edge are visible, communicating physical depth.

**Page-edge texture:** `repeating-linear-gradient` of cream/tan stripes (existing pattern, keep it).

---

## 3. Cover Opening Animation

| Phase | Duration | What happens |
|---|---|---|
| Click closed book | 0 ms | Set `isOpening = true` |
| Cover rotates | 700 ms | `.book-cover` animates `rotateY(0deg → -180deg)` around left edge (`transform-origin: left center`). `backface-visibility: hidden` makes it disappear past 90°. |
| Interior reveals | after 700 ms | `isOpen = true`, StPageFlip mounts, tilt resets to `rotateY(0deg)` smoothly |

**Closing:** Reverse. StPageFlip unmounts, cover rotates back `(-180deg → 0deg)`, tilt restores.

CSS keyframe:
```css
@keyframes cover-open {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(-180deg); }
}
```

---

## 4. StPageFlip Integration

**Package:** `page-flip` (npm) — the `HTMLFlipBook` React component wrapper.

**Mount point:** `.book-interior` div (720×500px), rendered only when `isOpen = true`.

**Configuration:**
```tsx
<HTMLFlipBook
  width={360} height={500}       // single page size; two shown = 720×500 total
  size="fixed"
  drawShadow={true}              // shadow under the turning page arc
  flippingTime={700}             // matches cover open speed
  useMouseEvents={true}          // enables drag-to-flip gesture
  ref={flipBookRef}
>
  {/* Page 0: title spread left */}
  {/* Page 1: title spread right = story page 1 */}
  {/* Pages 2…N: story pages */}
</HTMLFlipBook>
```

**Page 0 (left of first spread):** Title page — small cover image, genre tag, creation date, book title in Playfair Display. Dark paper background (`#F5EDD9`).

**Pages 1…N:** Each `book.pages[i]` rendered as a `<BookPage side="right" content={...} />` div.

**Click-to-flip:**
- `onClick` on every right-side page div → `flipBookRef.current.pageFlip().flipNext()`
- `onClick` on every left-side page div → `flipBookRef.current.pageFlip().flipPrev()`
- Keyboard `ArrowRight` → `flipNext()`, `ArrowLeft` → `flipPrev()`

**Page counter sync:** StPageFlip `onFlip` event → update `currentPage` state → update toolbar counter.

**Edit mode:** When `editMode = true`, StPageFlip is replaced with the existing editable textarea layout (no page flip needed while editing). A "Done Editing" button returns to the flip view.

---

## 5. Bookshelf Fixes

### Fix 1: New Story button always visible

**Root cause:** `BookShelf`'s scroll container grows unbounded, pushing the button below the panel.

**Fix:** Add `min-height: 0` to the flex scroll wrapper so it respects the parent's bounded height. The New Story button div stays `flex-none` outside the scroll container.

```tsx
// BookShelf outer
<div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
  <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
    {/* shelf rows */}
  </div>
  <div className="flex-none px-[14px] pb-3 pt-2 border-t border-ink-border">
    <button>+ New Story</button>
  </div>
</div>
```

### Fix 2: Hidden scrollbar

Add to `src/index.css` targeting the bookshelf scroll container:

```css
.shelf-scroll {
  scrollbar-width: none;
}
.shelf-scroll::-webkit-scrollbar {
  display: none;
}
```

Add `shelf-scroll` class to the scroll div in `BookShelf.tsx`.

### Fix 3: Action icons always visible, larger

Remove the hover-reveal from `.book-actions` (remove `opacity: 0` and the `:hover` rule that sets it to 1). Icons are always shown beneath each spine.

Increase `.book-action-btn` from `22px × 22px` to `28px × 28px` and font-size from `11px` to `13px`.

---

## 6. Files Changed

| File | Change |
|---|---|
| `src/components/book/OpenBook.tsx` | Full rewrite — 3D book object + StPageFlip integration, cover open/close |
| `src/components/book/BookPage.tsx` | Minor — expose as a standalone div without outer sizing (StPageFlip controls sizing) |
| `src/components/bookshelf/BookShelf.tsx` | Add `min-height: 0`, add `shelf-scroll` class |
| `src/components/bookshelf/BookCover.tsx` | Remove hover-reveal from actions, keep always visible |
| `src/index.css` | Add `cover-open` keyframe, `.book-3d-*` classes, `.shelf-scroll` hidden scrollbar, `.book-action-btn` size update, remove `.book-actions` hover rule |
| `package.json` | Add `page-flip` dependency |

---

## 7. Out of Scope

- Drag-to-open the cover (click only)
- Page shadows on the table surface (no change)
- Mobile / responsive layout (desktop-first, no change)
- Edit mode page flip animation (edit mode disables StPageFlip, uses textarea layout)
