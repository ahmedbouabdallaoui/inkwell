export function InkDropLoader() {
  return (
    <span className="relative inline-flex h-4 w-4" aria-hidden>
      <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75"
            style={{ animation: 'ink-ripple 1s ease-out infinite' }} />
      <span className="relative inline-flex rounded-full h-4 w-4 bg-white opacity-50" />
    </span>
  )
}
