import { useMutation } from '@tanstack/react-query'
import { generateStory } from '../api/generation'
import { useInvalidateBooks } from './useBooks'

export function useGeneration() {
  const invalidateBooks = useInvalidateBooks()
  return useMutation({
    mutationFn: generateStory,
    onSuccess: () => invalidateBooks(),
  })
}
