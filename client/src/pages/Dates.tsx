import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dates from '../data/dates.json'

export default function Dates() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return dates
    return dates.filter(
      (item) => item.date.toLowerCase().includes(q) || item.event.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="flex flex-col gap-4">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-xl text-(--color-brand-green)">‹</span>
        <h1 className="text-xl font-semibold text-(--color-ink)">Даты</h1>
      </Link>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по датам и событиям"
        className="rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-ink) outline-none focus:border-(--color-brand-green)"
      />

      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="text-(--color-muted)">Ничего не найдено.</p>
        ) : (
          filtered.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-3 text-sm"
            >
              <span className="font-semibold text-(--color-brand-green)">{item.date}</span>
              <span className="text-(--color-muted)"> – </span>
              <span className="text-(--color-ink)">{item.event}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
