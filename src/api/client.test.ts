import { vi, describe, it, expect, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof axios>('axios')
  return {
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        interceptors: {
          request: { use: vi.fn() },
        },
      })),
    },
  }
})

describe('api client', () => {
  it('creates an axios instance with the correct base URL', async () => {
    import.meta.env.VITE_API_URL = 'https://api.inkwell.app'
    const { apiClient } = await import('./client')
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://api.inkwell.app' })
    )
  })
})
