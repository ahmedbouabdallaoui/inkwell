import React from 'react'
import { vi, describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useBooks } from './useBooks'

vi.mock('../api/books', () => ({
  fetchBooks: vi.fn().mockResolvedValue([
    { id: '1', title: 'Test Book', genre: 'Fantasy', characters: '', setting: '',
      coverImageUrl: '', pages: [], createdAt: '', userId: 'u1' },
  ]),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useBooks', () => {
  it('returns a list of books', async () => {
    const { result } = renderHook(() => useBooks(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].title).toBe('Test Book')
  })
})
