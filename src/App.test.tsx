// src/App.test.tsx
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test', email: 'a@b.com', name: 'Test' }, loading: false, login: vi.fn(), logout: vi.fn() }),
}))
vi.mock('./hooks/useBooks',     () => ({ useBooks:           () => ({ data: [] }),            useInvalidateBooks: () => vi.fn() }))
vi.mock('./hooks/useChallenge', () => ({ useChallenge:       () => ({ data: undefined }) }))
vi.mock('./hooks/useGeneration',() => ({ useGeneration:      () => ({ mutate: vi.fn(), isPending: false, data: undefined }) }))
vi.mock('./hooks/usePdfExport', () => ({ usePdfExport:       () => ({ mutateAsync: vi.fn() }) }))

test('renders the Inkwell shell', () => {
  render(<App />)
  expect(screen.getByText('Inkwell')).toBeInTheDocument()
  expect(screen.getByText(/Select a story from your shelf/i)).toBeInTheDocument()
})
