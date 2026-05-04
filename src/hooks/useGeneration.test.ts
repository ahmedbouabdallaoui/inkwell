import React from 'react'
import { vi, describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useGeneration } from './useGeneration'

const mockBook = { id: '99', title: 'New Story', genre: 'Fantasy', characters: '', setting: '',
                   coverImageUrl: '', pages: ['p1'], createdAt: '', userId: 'u1' }

vi.mock('../api/generation', () => ({
  generateStory: vi.fn().mockResolvedValue({
    id: '99', title: 'New Story', genre: 'Fantasy', characters: '', setting: '',
    coverImageUrl: '', pages: ['p1'], createdAt: '', userId: 'u1',
  }),
}))
vi.mock('./useBooks', () => ({ useInvalidateBooks: vi.fn(() => vi.fn()) }))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useGeneration', () => {
  it('calls generateStory and returns the new book', async () => {
    const { result } = renderHook(() => useGeneration(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ genre: 'Fantasy', characters: 'Arin', setting: 'Empire' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockBook)
  })
})
