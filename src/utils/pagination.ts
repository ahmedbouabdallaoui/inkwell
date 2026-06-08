const CHARS_PER_PAGE = 770

function splitPageContent(content: string): string[] {
  if (!content || content.length <= CHARS_PER_PAGE) return [content]

  const parts: string[] = []
  let remaining = content

  while (remaining.length > 0) {
    if (remaining.length <= CHARS_PER_PAGE) {
      parts.push(remaining)
      break
    }

    const slice = remaining.slice(0, CHARS_PER_PAGE)
    const breakAt = Math.max(
      slice.lastIndexOf('\n\n'),
      slice.lastIndexOf('. '),
      slice.lastIndexOf('! '),
      slice.lastIndexOf('? '),
      slice.lastIndexOf(' '),
    )

    const splitPos = breakAt > 0 ? breakAt + 1 : CHARS_PER_PAGE
    parts.push(remaining.slice(0, splitPos))
    remaining = remaining.slice(splitPos).trimStart()
  }

  return parts.filter((p) => p.length > 0)
}

export function paginatePages(pages: string[]): string[] {
  return pages.flatMap(splitPageContent)
}
