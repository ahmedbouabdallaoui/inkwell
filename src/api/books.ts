import { apiClient } from './client'
import type { Book } from '../types'

export const fetchBooks  = ()   => apiClient.get<Book[]>('/books').then((r) => r.data)
export const fetchBook   = (id: string) => apiClient.get<Book>(`/books/${id}`).then((r) => r.data)
