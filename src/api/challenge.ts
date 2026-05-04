import { apiClient } from './client'
import type { Challenge } from '../types'

export const fetchChallenge = () => apiClient.get<Challenge>('/challenge').then((r) => r.data)
