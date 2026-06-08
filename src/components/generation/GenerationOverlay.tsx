import { AnimatePresence, motion } from 'framer-motion'
import { Wordmark } from '../brand/Wordmark'
import { GenerationForm } from './GenerationForm'
import type { GenerationInput } from '../../types'

interface GenerationOverlayProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: GenerationInput) => void
  loading: boolean
  initialValues?: Partial<GenerationInput>
  error?: string | null
}

export function GenerationOverlay({ open, onClose, onSubmit, loading, initialValues, error }: GenerationOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="overlay-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(15,15,18,0.95)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-xl bg-ink-surface border border-ink-border p-8 flex flex-col gap-6"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-1">
              <Wordmark />
              <p className="text-sm font-sans text-ink-muted">
                What will you write today?
              </p>
            </div>
            {error && (
              <p className="text-sm font-sans text-red-400 text-center bg-red-900/20 rounded-md px-3 py-2">{error}</p>
            )}
            <GenerationForm onSubmit={onSubmit} loading={loading} initialValues={initialValues} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
