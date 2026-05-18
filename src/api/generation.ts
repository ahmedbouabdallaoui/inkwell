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
    const poll = setInterval(async () => {
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
