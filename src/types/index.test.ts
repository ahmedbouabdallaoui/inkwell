import type { Book, Challenge } from './index'

test('Book type has required shape', () => {
  const book: Book = {
    id: '1',
    title: 'The Dragon Wakes',
    genre: 'Fantasy',
    characters: 'Arin, a reluctant mage',
    setting: 'A collapsing empire',
    coverImageUrl: 'https://example.com/cover.jpg',
    pages: ['Once upon a time...', 'The second page...'],
    createdAt: '2026-05-04T10:00:00Z',
    userId: 'user-1',
  }
  expect(book.id).toBe('1')
  expect(book.pages).toHaveLength(2)
})

test('Challenge type has required shape', () => {
  const challenge: Challenge = {
    id: 'c1',
    prompt: 'Write about a letter never sent.',
    date: '2026-05-04',
    streakCount: 7,
  }
  expect(challenge.streakCount).toBe(7)
})
