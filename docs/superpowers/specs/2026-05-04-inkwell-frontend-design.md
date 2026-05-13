# Inkwell — Frontend Design Spec

**Date:** 2026-05-04
**Project:** AI Story Prompt Generator
**Brand Name:** Inkwell
**Stack:** React SPA (CloudFront + S3), FastAPI backend on AWS

---

## 1. Vision

Inkwell is a dark, editorial web app where users generate AI-powered story prompts and experience them as real books — cover art on the outside, flippable pages on the inside. The shell of the app is clean and Notion-dark; the book itself is warm, theatrical, and immersive. Opening a book is a deliberate moment, not just a UI transition.

---

## 2. Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#0F0F12` | App shell, outermost layer |
| Surface | `#1A1A1F` | Left panel, modals, overlays |
| Surface raised | `#242429` | Cards, hover states |
| Border | `#2E2E35` | Dividers, panel edges |
| Text primary | `#E8E8F0` | Headings, body UI text |
| Text muted | `#8888A0` | Labels, timestamps, secondary info |
| Accent violet | `#8B6FE8` | Buttons, active states, glows, challenge card border |
| Accent glow | `#8B6FE8` @ 20% opacity | Ambient glow, hover rings on book covers |
| Book paper | `#F5EDD9` | Open book interior pages |
| Book ink | `#2C2416` | Story text inside the book |

The two-register split is the core design principle: everything outside the book is cool near-black; everything inside is warm cream. Opening a book creates a literal light-in-the-dark effect.

---

## 3. Typography

| Context | Typeface | Notes |
|---------|----------|-------|
| UI chrome | Inter | All panel labels, navigation, form fields |
| Book interior | Lora (serif) | Story text only — literary, readable, warm |
| Brand / wordmark | Playfair Display | "Inkwell" in the top-left corner |
| Streak / numbers | Inter Mono | Subtle techy contrast to the literary serif |

---

## 4. Layout

Three fixed zones:

```
┌─────────────────┬──────────────────────────────────┐
│   LEFT PANEL    │         MAIN STAGE               │
│   280px fixed   │         flex-fill                │
│                 │                                  │
│ ┌─────────────┐ │      ┌──────────────────┐        │
│ │ 🔥 Challenge│ │      │                  │        │
│ │    card     │ │      │   Open Book      │        │
│ └─────────────┘ │      │   (2-page spread)│        │
│                 │      │                  │        │
│  [cover] [cover]│      │  left pg | right │        │
│  [cover] [cover]│      │          | page  │        │
│  [cover] [cover]│      │                  │        │
│       ...       │      └──────────────────┘        │
│                 │                                  │
│    [+] New      │                                  │
└─────────────────┴──────────────────────────────────┘
```

### 4.1 Left Panel — Bookshelf

- **Today's Challenge card** — sticky at top; violet glow border; flame icon + streak count; one-line prompt teaser; "Accept Challenge" CTA button
- **Book grid** — 2-column cover thumbnails below the challenge card; panel scrolls when books overflow; challenge card stays sticky
- **"+ New Story" button** — full-width ghost button at panel bottom; triggers the generation overlay

### 4.2 Main Stage — Open Book

- **Closed / empty state:** Centered ghosted book illustration, muted label "Select a story from your shelf"
- **Open state:** Realistic two-page spread centered on screen
  - Left page: book title, genre tag, creation date, decorative drop cap
  - Right page: story text in Lora, paginated; click the right page edge to flip forward, left edge to flip back
  - Bottom: page counter `3 / 7`, PDF export icon (triggers async job), share icon (copies presigned S3 URL to clipboard)
- **New user empty shelf:** Single ghosted book slot with dashed violet border and "+ Create your first story" label

### 4.3 Generation Overlay

- Full-screen backdrop `#0F0F12` at 95% opacity
- Center card (`#1A1A1F`) with Inkwell wordmark at top
- Three labeled inputs: Genre, Characters, Setting
- "Generate" button — violet, full-width
- On complete: overlay dissolves, new book slides onto shelf and opens automatically

---

## 5. Interactions & Animations

| Moment | Behavior |
|--------|----------|
| Hover book cover | Cover lifts, tilt corrects to straight, violet glow ring underneath |
| Click book | Cover slides from shelf to center, expands into open two-page spread |
| Page flip | CSS 3D `rotateY`, cream page curls from right edge, ~400ms ease-in-out |
| New book added | Slides in from bottom of shelf with spring easing |
| Book closes | Shrinks and returns to shelf position |
| Generating | Ink-drop ripple animation from center of overlay; Generate button becomes a progress ring |
| Challenge accepted | Challenge card flips to show full prompt; "Write Now" pre-fills the generation overlay |

---

## 6. Brand Details

- **Wordmark:** "Inkwell" in Playfair Display, top-left of the left panel
- **Logo mark:** Small ink drop glyph `◆` in violet, preceding the wordmark
- **Favicon:** The ink drop glyph alone — readable at 16px
- **Page title:** `Inkwell — {Book Title}` when a book is open; `Inkwell` otherwise

---

## 7. Out of Scope (v1)

- Mobile / responsive layout — desktop-first only
- Social sharing beyond a presigned PDF download link
- Collaborative or multiplayer books
- Dark/light mode toggle — dark only

---

## 8. Backend Integration Points (Frontend Concerns)

| Feature | API Interaction |
|---------|----------------|
| Generate story + cover | POST to FastAPI → Bedrock Nova Lite (text) + Nova Canvas (image) |
| Auth / user session | Cognito tokens via Amplify or direct Cognito hosted UI |
| Load user books | GET books from RDS via FastAPI |
| PDF export | POST job to SQS queue → Lambda → presigned S3 URL returned async |
| Daily challenge | Displayed from EventBridge-triggered challenge stored in RDS |
| Streak tracking | Read/write streak data from RDS on each session start |
