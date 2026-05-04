import { useQuery } from '@tanstack/react-query'
import { fetchChallenge } from '../api/challenge'

export function useChallenge() {
  return useQuery({ queryKey: ['challenge'], queryFn: fetchChallenge })
}
