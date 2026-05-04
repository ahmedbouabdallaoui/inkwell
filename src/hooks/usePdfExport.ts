import { useMutation } from '@tanstack/react-query'
import { requestPdfExport, fetchPdfJob } from '../api/pdf'

export function usePdfExport() {
  return useMutation({
    mutationFn: async (bookId: string) => {
      const job = await requestPdfExport(bookId)
      return new Promise<string>((resolve, reject) => {
        const poll = setInterval(async () => {
          try {
            const updated = await fetchPdfJob(job.jobId)
            if (updated.status === 'complete' && updated.downloadUrl) {
              clearInterval(poll)
              resolve(updated.downloadUrl)
            } else if (updated.status === 'failed') {
              clearInterval(poll)
              reject(new Error('PDF generation failed'))
            }
          } catch (e) {
            clearInterval(poll)
            reject(e)
          }
        }, 2000)
      })
    },
  })
}
