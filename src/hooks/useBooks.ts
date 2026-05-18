import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchBooks } from '../api/books'

export function useBooks() {
  return useQuery({ queryKey: ['books'], queryFn: fetchBooks })
}

export function useInvalidateBooks() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['books'] })
}
