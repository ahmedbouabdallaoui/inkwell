interface RightPageProps {
  side: 'right'
  content: string
  title?: never
  genre?: never
  createdAt?: never
}

interface LeftPageProps {
  side: 'left'
  content: string
  title: string
  genre: string
  createdAt: string
}

type BookPageProps = RightPageProps | LeftPageProps

export function BookPage(props: BookPageProps) {
  const baseClasses = 'h-full w-full bg-ink-paper p-8 overflow-hidden flex flex-col'

  if (props.side === 'left') {
    return (
      <div className={baseClasses}>
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4">
          <span className="inline-block px-3 py-1 rounded-full bg-ink-bookink/10 text-ink-bookink text-xs font-sans font-medium">
            {props.genre}
          </span>
          <h1 className="font-display text-2xl text-ink-bookink leading-tight">
            {props.title}
          </h1>
          <p className="text-xs font-sans text-ink-bookink/50 mt-2">
            {new Date(props.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={baseClasses}>
      <p className="font-serif text-sm text-ink-bookink leading-relaxed whitespace-pre-wrap">
        {props.content}
      </p>
    </div>
  )
}
