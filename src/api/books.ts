import { apiClient } from './client'
import type { Book } from '../types'

interface BooksResponse {
  books: Book[]
  total: number
}

export const fetchBooks = () =>
  apiClient.get<BooksResponse>('/books').then((r) => r.data.books)

export const fetchBook = (id: string) =>
  apiClient.get<Book>(`/books/${id}`).then((r) => r.data)

export const updateBook = (id: string, data: { title?: string; pages?: string[] }) =>
  apiClient.patch<Book>(`/books/${id}`, data).then((r) => r.data)

export const deleteBook = (id: string) =>
  apiClient.delete(`/books/${id}`)

export const toggleFavourite = (id: string) =>
  apiClient.put<Book>(`/books/${id}/favourite`).then((r) => r.data)
