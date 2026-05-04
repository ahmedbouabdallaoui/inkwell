export interface Book {
  id: string
  title: string
  genre: string
  characters: string
  setting: string
  coverImageUrl: string
  pages: string[]
  createdAt: string
  userId: string
}

export interface Challenge {
  id: string
  prompt: string
  date: string
  streakCount: number
}

export interface GenerationInput {
  genre: string
  characters: string
  setting: string
}

export interface PdfJob {
  jobId: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
  downloadUrl?: string
}

export interface User {
  id: string
  email: string
  name: string
}
