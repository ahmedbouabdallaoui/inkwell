// src/App.test.tsx
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./auth/CognitoProvider', () => ({
  CognitoProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
