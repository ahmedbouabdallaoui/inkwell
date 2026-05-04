import React from 'react'
import { vi, describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useChallenge } from './useChallenge'

vi.mock('../api/challenge', () => ({
  fetchChallenge: vi.fn().mockResolvedValue({
    id: 'c1', prompt: 'Write about loss.', date: '2026-05-04', streakCount: 5,
  }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useChallenge', () => {
  it('returns today\'s challenge with streak count', async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.streakCount).toBe(5)
  })
})
