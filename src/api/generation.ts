import { apiClient } from './client'
import type { Book, GenerationInput } from '../types'

interface GenerationJobStatus {
  jobId: string
  status: string
  book?: Book
  error?: string
}

export const generateStory = async (input: GenerationInput): Promise<Book> => {
  const { data: job } = await apiClient.post<{ jobId: string }>('/generate', input)
  return new Promise((resolve, reject) => {
    let retries = 0
    const MAX_RETRIES = 60
    const poll = setInterval(async () => {
      retries++
      if (retries > MAX_RETRIES) {
        clearInterval(poll)
        reject(new Error('Generation timed out'))
        return
      }
      try {
        const { data } = await apiClient.get<GenerationJobStatus>(`/generate/${job.jobId}`)
        if (data.status === 'complete' && data.book) {
          clearInterval(poll)
          resolve(data.book)
        } else if (data.status === 'failed') {
          clearInterval(poll)
          reject(new Error(data.error ?? 'Generation failed'))
        }
      } catch (e) {
        clearInterval(poll)
        reject(e)
      }
    }, 2000)
  })
}
