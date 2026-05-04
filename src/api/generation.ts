import { apiClient } from './client'
import type { Book, GenerationInput } from '../types'

export const generateStory = (input: GenerationInput) =>
  apiClient.post<Book>('/generate', input).then((r) => r.data)
