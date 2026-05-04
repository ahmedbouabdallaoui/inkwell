import React from 'react'
import { vi, describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { usePdfExport } from './usePdfExport'

vi.mock('../api/pdf', () => ({
  requestPdfExport: vi.fn().mockResolvedValue({ jobId: 'job-1', status: 'pending' }),
  fetchPdfJob:      vi.fn().mockResolvedValue({ jobId: 'job-1', status: 'complete', downloadUrl: 'https://s3.example.com/story.pdf' }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('usePdfExport', () => {
  it('polls and resolves with the download URL', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => usePdfExport(), { wrapper })

    let url: string | undefined
    act(() => { result.current.mutateAsync('book-1').then((u) => { url = u }) })
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(url).toBe('https://s3.example.com/story.pdf')
    vi.useRealTimers()
  })
})
