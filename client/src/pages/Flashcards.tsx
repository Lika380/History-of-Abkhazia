import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import toc from '../data/tableOfContents.json'

interface TocItem {
  number?: number
  title: string
  page: number
}

interface TocSection {
  title: string
  items: TocItem[]
}

function TocRow({ id, item }: { id: string; item: TocItem }) {
  return (
    <li>
      <Link to={`/material/${id}`} className="text-sm text-(--color-ink) underline decoration-(--color-border) underline-offset-2">
        {item.number ? `§${item.number}. ` : ''}
        {item.title}
      </Link>
    </li>
  )
}

export default function Flashcards() {
  const sections = toc.sections as TocSection[]
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return
    const el = document.getElementById(location.hash.slice(1))
    el?.scrollIntoView({ block: 'start' })
  }, [location.hash])

  return (
    <div className="flex flex-col gap-4 print:gap-3">
      <Link to="/" className="flex items-center gap-2 print:hidden">
        <span className="text-xl text-(--color-brand-green)">‹</span>
        <h1 className="text-xl font-semibold text-(--color-ink)">Материал для печати</h1>
      </Link>

      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 print:rounded-none print:border-0 print:p-0">
        <ul className="mb-4 flex flex-col gap-1">
          {toc.intro.items.map((item, i) => (
            <TocRow key={item.title} id={`intro-${i}`} item={item} />
          ))}
        </ul>

        {sections.map((section, sectionIndex) => (
          <div key={section.title} id={`section-${sectionIndex}`} className="mb-4 scroll-mt-4 break-inside-avoid">
            <h3 className="mb-2 text-sm font-semibold text-(--color-ink)">{section.title}</h3>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <TocRow key={item.number} id={`s${sectionIndex}-${item.number}`} item={item} />
              ))}
            </ul>
          </div>
        ))}

        <div className="break-inside-avoid">
          <h3 className="mb-2 text-sm font-semibold text-(--color-ink)">{toc.outro.title}</h3>
          <ul className="flex flex-col gap-1">
            {toc.outro.items.map((item, i) => (
              <TocRow key={item.title} id={`outro-${i}`} item={item} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
