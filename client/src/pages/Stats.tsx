import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth'
import { useCharacterStore } from '../store/character'
import { useRatingStore } from '../store/rating'
import CharacterAvatar from '../components/CharacterAvatar'
import ranks from '../data/ranks.json'
import artifacts from '../data/artifacts.json'
import { completedEpochsCount, EPOCH_COUNT } from '../lib/characterStage'
import { materialTopics } from '../lib/materialTopics'

export default function Stats() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const characterId = useCharacterStore((s) => s.characterId)
  const avatar = useCharacterStore((s) => s.avatar)
  const fetchCharacter = useCharacterStore((s) => s.fetchCharacter)
  const byTopic = useRatingStore((s) => s.byTopic)
  const fetchMyRating = useRatingStore((s) => s.fetchMyRating)
  const leaderboard = useRatingStore((s) => s.leaderboard)
  const fetchLeaderboard = useRatingStore((s) => s.fetchLeaderboard)
  const [artifactsOpen, setArtifactsOpen] = useState(0)

  useEffect(() => {
    fetchCharacter()
    fetchMyRating()
    fetchLeaderboard()
    api.getArtifacts().then(({ unlockedIds }) => setArtifactsOpen(unlockedIds.length))
  }, [fetchCharacter, fetchMyRating, fetchLeaderboard])

  const epochsDone = completedEpochsCount(byTopic)
  const epochsTotal = EPOCH_COUNT
  const epochsPercent = Math.round((epochsDone / epochsTotal) * 100)

  const testsTotal = materialTopics.length
  const testsPassed = byTopic.filter((t) => t.totalQuestions > 0 && t.bestScore === t.totalQuestions).length

  const artifactsTotal = artifacts.length

  const rankIndex = 0

  return (
    <div className="flex flex-col gap-4">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-xl text-(--color-brand-green)">‹</span>
        <h1 className="text-xl font-semibold text-(--color-ink)">Мой персонаж</h1>
      </Link>

      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-(--color-ink)">{user?.name || 'Без имени'}</span>
          <Link to="/stats/character" className="text-sm text-(--color-brand-green)">
            {characterId ? 'Сменить' : 'Выбрать персонажа'}
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        <h2 className="mb-3 text-lg font-semibold text-(--color-ink)">Мои успехи</h2>

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] text-(--color-ink)">
              Изучено эпох: {epochsDone} из {epochsTotal}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-surface-alt)">
              <div className="h-full rounded-full bg-(--color-brand-green)" style={{ width: `${epochsPercent}%` }} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] text-(--color-ink)">
              Пройдено тестов: {testsPassed} из {testsTotal}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-surface-alt)">
              <div
                className="h-full rounded-full bg-(--color-brand-green)"
                style={{ width: `${testsTotal ? (testsPassed / testsTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] text-(--color-ink)">
              Открыто артефактов: {artifactsOpen} из {artifactsTotal}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-surface-alt)">
              <div
                className="h-full rounded-full bg-(--color-brand-green)"
                style={{ width: `${artifactsTotal ? (artifactsOpen / artifactsTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {ranks.map((rank, i) => {
            const isCurrent = i === rankIndex
            const isLocked = i > rankIndex
            return (
              <div key={rank} className="flex flex-col items-center gap-1 text-center">
                <div
                  className={`relative mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-lg ${
                    isCurrent
                      ? 'bg-(--color-brand-green-light)'
                      : isLocked
                        ? 'border border-(--color-border) bg-(--color-surface-alt)'
                        : 'border border-(--color-brand-green) bg-(--color-brand-green-light)'
                  }`}
                >
                  {isCurrent ? (
                    <CharacterAvatar
                      name={user?.name || '?'}
                      icon={avatar ?? undefined}
                      colorIndex={characterId === 'female' ? 1 : 0}
                      size={56}
                    />
                  ) : isLocked ? (
                    <img src="/key.webp" alt="" className="h-6 w-6 object-contain" />
                  ) : (
                    '🏆'
                  )}
                </div>
                <span
                  className={`text-[10px] leading-tight ${isLocked ? 'text-(--color-muted)' : 'text-(--color-ink)'}`}
                >
                  {isCurrent ? `Звание: ${rank}` : isLocked ? `Цель: ${rank}` : rank}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        <Link to="/rating" className="mb-2 flex items-center gap-1.5 text-sm text-(--color-ink)">
          <span className="font-semibold">Общий рейтинг</span>
          <span className="text-(--color-brand-green)">›</span>
        </Link>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-(--color-muted)">Пока никто не прошёл ни одного теста в этом сезоне.</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {leaderboard.slice(0, 3).map((entry) => (
              <li key={entry.rank} className="flex items-center justify-between rounded-lg px-2 py-1">
                <span className="text-sm text-(--color-ink)">
                  {entry.rank}. {entry.name}
                </span>
                <span className="text-sm font-medium text-(--color-ink)">{entry.total}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <button
        onClick={() => void logout()}
        className="self-start rounded-xl border border-(--color-border) px-4 py-2 text-(--color-brand-red)"
      >
        Выйти
      </button>
    </div>
  )
}
