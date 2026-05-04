import { useState, FormEvent } from 'react'
import { InkDropLoader } from './InkDropLoader'
import type { GenerationInput } from '../../types'

interface GenerationFormProps {
  onSubmit: (input: GenerationInput) => void
  loading: boolean
  initialValues?: Partial<GenerationInput>
}

export function GenerationForm({ onSubmit, loading, initialValues }: GenerationFormProps) {
  const [genre,      setGenre]      = useState(initialValues?.genre      ?? '')
  const [characters, setCharacters] = useState(initialValues?.characters ?? '')
  const [setting,    setSetting]    = useState(initialValues?.setting    ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ genre, characters, setting })
  }

  const fieldClass = "w-full rounded-md border border-ink-border bg-ink-bg px-3 py-2 text-sm font-sans text-ink-text placeholder-ink-muted focus:outline-none focus:border-ink-violet transition-colors"
  const labelClass = "block text-xs font-sans font-medium text-ink-muted mb-1"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div>
        <label htmlFor="genre" className={labelClass}>Genre</label>
        <input id="genre" className={fieldClass} placeholder="Fantasy, Sci-Fi, Horror…"
               value={genre} onChange={(e) => setGenre(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="characters" className={labelClass}>Characters</label>
        <input id="characters" className={fieldClass} placeholder="A reluctant mage, her mentor…"
               value={characters} onChange={(e) => setCharacters(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="setting" className={labelClass}>Setting</label>
        <input id="setting" className={fieldClass} placeholder="A collapsing empire at war…"
               value={setting} onChange={(e) => setSetting(e.target.value)} required />
      </div>
      <button
        type="submit"
        disabled={loading}
        aria-label="Generate"
        className="mt-2 w-full rounded-md bg-ink-violet py-2.5 text-sm font-sans font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
      >
        {loading ? <><InkDropLoader /> Generating…</> : 'Generate'}
      </button>
    </form>
  )
}
