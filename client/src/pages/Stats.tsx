import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useCharacterStore } from '../store/character'
import { useRatingStore } from '../store/rating'
import CharacterAvatar from '../components/CharacterAvatar'
import charactersData from '../data/characters.json'
import ranks from '../data/ranks.json'
import artifacts from '../data/artifacts.json'
import { completedEpochsCount, EPOCH_COUNT, type Group } from '../lib/characterStage'
import { materialTopics } from '../lib/materialTopics'

const groups = charactersData.groups as Group[]

function findCharacter(characterId: string | null) {
  if (!characterId) return null
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const characterIndex = groups[groupIndex].characters.findIndex((c) => c.id === characterId)
    if (characterIndex !== -1) {
      const colorIndex = groupIndex * groups[groupIndex].characters.length + characterIndex
      return { character: groups[groupIndex].characters[characterIndex], group: groups[groupIndex], colorIndex }
    }
  }
  return null
}

export default function Stats() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const characterId = useCharacterStore((s) => s.characterId)
  const fetchCharacter = useCharacterStore((s) => s.fetchCharacter)
  const byTopic = useRatingStore((s) => s.byTopic)
  const fetchMyRating = useRatingStore((s) => s.fetchMyRating)
  const leaderboard = useRatingStore((s) => s.leaderboard)
  const fetchLeaderboard = useRatingStore((s) => s.fetchLeaderboard)
  const email = user?.email
  const myRowRef = useRef<HTMLLIElement | null>(null)

  function scrollToMe() {
    myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  useEffect(() => {
    fetchCharacter()
    fetchMyRating()
    fetchLeaderboard()
  }, [fetchCharacter, fetchMyRating, fetchLeaderboard])

  const found = findCharacter(characterId)
  const stage = found ? found.character.stages[0] : null

  const epochsDone = completedEpochsCount(byTopic)
  const epochsTotal = EPOCH_COUNT
  const epochsPercent = Math.round((epochsDone / epochsTotal) * 100)

  const testsTotal = materialTopics.length
  const testsPassed = byTopic.filter((t) => t.totalQuestions > 0 && t.bestScore === t.totalQuestions).length

  const artifactsTotal = artifacts.length
  const artifactsOpen = Math.min(epochsDone, artifactsTotal)

  const rankIndex = 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-xl text-(--color-brand-green)">
          ←
        </Link>
        <h1 className="text-xl font-semibold text-(--color-ink)">Мой персонаж</h1>
      </div>

      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        {found && stage ? (
          <div className="flex items-center justify-between">
            <span className="font-medium text-(--color-ink)">{user?.name || 'Без имени'}</span>
            <Link to="/stats/character" className="text-sm text-(--color-brand-green)">
              Сменить
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="font-medium text-(--color-ink)">{user?.name || 'Без имени'}</span>
            <Link to="/stats/character" className="text-sm text-(--color-brand-green)">
              Выбрать персонажа
            </Link>
          </div>
        )}
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
                    found && stage ? (
                      <CharacterAvatar name={found.character.name} icon={stage.icon} colorIndex={found.colorIndex} size={56} />
                    ) : (
                      <img src="/frame20.png" alt={rank} className="h-full w-full object-cover" />
                    )
                  ) : isLocked ? (
                    <>
                      <img src="/frame20.png" alt={rank} className="h-full w-full object-cover blur-[2px]" />
                      <span className="absolute inset-0 flex items-center justify-center bg-(--color-surface)/40">🔒</span>
                    </>
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
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-(--color-muted)">Общий рейтинг</p>
          {leaderboard.some((entry) => entry.email === email) && (
            <button onClick={scrollToMe} className="text-xs text-(--color-brand-green)">
              Найти себя
            </button>
          )}
        </div>
        {leaderboard.length === 0 ? (
          <p className="text-(--color-muted)">Пока никто не прошёл ни одного теста.</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {leaderboard.map((entry) => {
              const isMe = email === entry.email
              return (
                <li
                  key={entry.rank}
                  ref={isMe ? myRowRef : undefined}
                  className={`flex items-center justify-between rounded-lg px-2 py-1 ${
                    isMe ? 'bg-(--color-brand-green-light)' : ''
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
