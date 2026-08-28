import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth'
import { useRatingStore } from '../store/rating'

interface LegendSeason {
  year: number
  entries: { rank: number; name: string; email: string; total: number }[]
}

export default function Rating() {
  const email = useAuthStore((s) => s.user?.email)
  const leaderboard = useRatingStore((s) => s.leaderboard)
  const seasonYear = useRatingStore((s) => s.seasonYear)
  const fetchLeaderboard = useRatingStore((s) => s.fetchLeaderboard)

  const [tab, setTab] = useState<'current' | 'legends'>('current')
  const [query, setQuery] = useState('')
  const [legends, setLegends] = useState<LegendSeason[] | null>(null)
  const myRowRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  function openLegendsTab() {
    setTab('legends')
    if (legends === null) {
      api.getLegends().then(({ legends }) => setLegends(legends))
    }
  }

  function scrollToMe() {
    myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const filtered = query.trim()
    ? leaderboard.filter((entry) => entry.name.toLowerCase().includes(query.trim().toLowerCase()))
    : leaderboard

  return (
    <div className="flex flex-col gap-4">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-xl text-(--color-brand-green)">‹</span>
        <h1 className="text-xl font-semibold text-(--color-ink)">Общий рейтинг</h1>
      </Link>

      <div className="flex gap-3">
        <button
          onClick={() => setTab('current')}
          className={`text-sm ${tab === 'current' ? 'font-semibold text-(--color-ink)' : 'text-(--color-muted)'}`}
        >
          Общий рейтинг
        </button>
        <button
          onClick={openLegendsTab}
          className={`text-sm ${tab === 'legends' ? 'font-semibold text-(--color-ink)' : 'text-(--color-muted)'}`}
        >
          Зал легенд
        </button>
      </div>

      {tab === 'current' ? (
        <>
          {seasonYear !== null && (
            <p className="text-xs text-(--color-muted)">
              Сезон {seasonYear}–{seasonYear + 1} (до 1 мая)
            </p>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по имени"
              className="min-w-0 flex-1 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-ink) outline-none focus:border-(--color-brand-green)"
            />
            {leaderboard.some((entry) => entry.email === email) && (
              <button
                onClick={scrollToMe}
                className="shrink-0 rounded-xl border border-(--color-border) px-3 py-2 text-sm text-(--color-brand-green)"
              >
                Найти себя
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-(--color-muted)">
              {leaderboard.length === 0 ? 'Пока никто не прошёл ни одного теста в этом сезоне.' : 'Никого не найдено.'}
            </p>
          ) : (
            <ol className="flex flex-col gap-1">
              {filtered.map((entry) => {
                const isMe = email === entry.email
                return (
                  <li
                    key={entry.rank}
                    ref={isMe ? myRowRef : undefined}
                    className={`flex items-center justify-between rounded-xl p-3 ${
                      isMe ? 'bg-(--color-brand-green-light)' : 'bg-(--color-surface)'
                    }`}
                  >
                    <span className="text-sm text-(--color-ink)">
                      {entry.rank}. {entry.name}
                    </span>
                    <span className="text-sm font-medium text-(--color-ink)">{entry.total}</span>
                  </li>
                )
              })}
            </ol>
          )}
        </>
      ) : legends === null ? (
        <p className="text-sm text-(--color-muted)">Загрузка…</p>
      ) : legends.length === 0 ? (
        <p className="text-sm text-(--color-muted)">1 мая здесь появятся первые легенды</p>
      ) : (
        <div className="flex flex-col gap-4">
          {legends.map((season) => (
            <div key={season.year}>
              <p className="mb-2 text-xs font-semibold tracking-wide text-(--color-muted) uppercase">{season.year}</p>
              <ol className="flex flex-col gap-1">
                {season.entries.map((entry) => {
                  const isMe = email === entry.email
                  return (
                    <li
                      key={entry.rank}
                      className={`flex items-center justify-between rounded-xl p-3 ${
                        isMe ? 'bg-(--color-brand-green-light)' : 'bg-(--color-surface)'
                      }`}
                    >
                      <span className="text-sm text-(--color-ink)">
                        {entry.rank}. {entry.name}
                      </span>
                      <span className="text-sm font-medium text-(--color-ink)">{entry.total}</span>
                    </li>
                  )
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
