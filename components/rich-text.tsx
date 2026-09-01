import type { ReactNode } from 'react'

/**
 * Rendu d'un contenu éditorial simple saisi depuis le back-office.
 * Syntaxe supportée : ## titre, ### sous-titre, - liste, 1. liste, **gras**.
 */
function inline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>
  })
}

export function RichText({ content, className }: { content: string; className?: string }) {
  const blocks: ReactNode[] = []
  const lines = content.replace(/\r\n/g, '\n').split('\n')

  let list: { ordered: boolean; items: string[] } | null = null
  let paragraph: string[] = []

  const flushList = () => {
    if (!list) return
    const Tag = list.ordered ? 'ol' : 'ul'
    const items = list.items
    blocks.push(
      <Tag key={`list-${blocks.length}`}>
        {items.map((item, i) => (
          <li key={i}>{inline(item, `li-${blocks.length}-${i}`)}</li>
        ))}
      </Tag>
    )
    list = null
  }

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    const text = paragraph.join(' ')
    blocks.push(<p key={`p-${blocks.length}`}>{inline(text, `p-${blocks.length}`)}</p>)
    paragraph = []
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(line)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      const text = heading[2]
      blocks.push(
        level === 2 ? (
          <h2 key={`h-${blocks.length}`}>{text}</h2>
        ) : (
          <h3 key={`h-${blocks.length}`}>{text}</h3>
        )
      )
      continue
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line)
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line)
    if (bullet || numbered) {
      flushParagraph()
      const ordered = Boolean(numbered)
      if (!list || list.ordered !== ordered) {
        flushList()
        list = { ordered, items: [] }
      }
      list.items.push((bullet ?? numbered)![1])
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()

  return <div className={className ?? 'prose-sr'}>{blocks}</div>
}
