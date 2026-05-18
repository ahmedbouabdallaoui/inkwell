import { apiClient } from './client'
import type { PdfJob } from '../types'

export const requestPdfExport = (bookId: string) =>
  apiClient.post<PdfJob>(`/pdf/export`, { bookId }).then((r) => r.data)

export const fetchPdfJob = (jobId: string) =>
  apiClient.get<PdfJob>(`/pdf/${jobId}`).then((r) => r.data)
