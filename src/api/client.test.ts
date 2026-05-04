import { vi, describe, it, expect } from 'vitest'
import axios from 'axios'

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: { request: { use: vi.fn() } },
    })),
  },
}))

describe('api client', () => {
  it('creates an axios instance with the correct base URL', async () => {
    import.meta.env.VITE_API_URL = 'https://api.inkwell.app'
    await import('./client')
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://api.inkwell.app' })
    )
  })
})
