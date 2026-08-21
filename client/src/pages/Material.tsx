import { Link, useParams } from 'react-router-dom'
import toc from '../data/tableOfContents.json'
import materialContent from '../data/materialContent.json'

interface TocItem {
  number?: number
  title: string
  page: number
}

interface TocSection {
  title: string
  items: TocItem[]
}

function findItem(id: string | undefined): { title: string; sectionTitle: string } | null {
  if (!id) return null

  if (id.startsWith('intro-')) {
    const index = Number(id.slice('intro-'.length))
    const item = toc.intro.items[index]
    return item ? { title: item.title, sectionTitle: toc.intro.title } : null
  }

  if (id.startsWith('outro-')) {
    const index = Number(id.slice('outro-'.length))
    const item = toc.outro.items[index]
    return item ? { title: item.title, sectionTitle: toc.outro.title } : null
  }

  const match = id.match(/^s(\d+)-(\d+)$/)
  if (!match) return null
  const sectionIndex = Number(match[1])
  const itemNumber = Number(match[2])
  const section = (toc.sections as TocSection[])[sectionIndex]
  const item = section?.items.find((i) => i.number === itemNumber)
  return item && section ? { title: item.title, sectionTitle: section.title } : null
}

export default function Material() {
  const { id } = useParams<{ id: string }>()
  const found = findItem(id)
  const paragraphs = id ? (materialContent as Record<string, string[]>)[id] : undefined

  if (!found) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-(--color-muted)">Материал не найден.</p>
        <Link to="/flashcards" className="text-(--color-brand-green)">
          ← К содержанию
        </Link>
      </div>
    )
  }

  return (
    <div className="-mx-4 -my-6 flex min-h-svh flex-col gap-4 bg-(--color-paragraph) p-4">
      <Link to="/flashcards" className="text-sm text-(--color-brand-green) print:hidden">
        ← К содержанию
      </Link>

      <h1 className="text-xl font-semibold text-(--color-ink)">{found.title}</h1>

      {paragraphs ? (
        <div className="flex flex-col gap-3 text-(--color-ink)">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : (
        <p className="text-(--color-muted)">Текст скоро появится.</p>
      )}

      <button
        onClick={() => window.print()}
        className="self-start rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-2 text-sm font-medium text-(--color-ink) print:hidden"
      >
        Печать
      </button>
    </div>
  )
}
