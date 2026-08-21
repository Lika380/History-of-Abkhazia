import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { useRatingStore } from '../store/rating'
import { useCharacterStore } from '../store/character'
import { useAuthStore } from '../store/auth'
import CharacterAvatar from '../components/CharacterAvatar'
import charactersData from '../data/characters.json'
import ranks from '../data/ranks.json'
import { type Group } from '../lib/characterStage'
import { useCoinSound } from '../hooks/useCoinSound'

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

const blocks = [
  { id: 1, label: 'Первобытнообщинный строй и раннеклассовые образования', image: '/slide1.webp' },
  { id: 2, label: 'Эпоха феодализма', image: '/slide2.webp' },
  { id: 3, label: 'Новое время', image: '/slide3.webp' },
  { id: 4, label: 'Советское и постсоветское время', image: '/slide4.webp' },
]

export default function Home() {
  const leaderboard = useRatingStore((s) => s.leaderboard)
  const characterId = useCharacterStore((s) => s.characterId)
  const email = useAuthStore((s) => s.user?.email)
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated')
  const { playCoinSound } = useCoinSound()
  const myRowRef = useRef<HTMLLIElement | null>(null)

  function scrollToMe() {
    myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const found = findCharacter(characterId)
  const stage = found ? found.character.stages[0] : null

  const rankIndex = 0

  return (
    <div className="flex flex-col">
      <section className="-mx-4 -mt-6 rounded-b-2xl bg-(--color-surface) px-4 pt-4 pb-2">
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[3%] pb-1 sm:mx-0 sm:snap-start sm:px-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:snap-none">
          {blocks.map((block) => (
            <Link
              key={block.id}
              to={`/quiz/${block.id}`}
              className={`flex w-[90%] shrink-0 snap-center items-center justify-center overflow-hidden rounded-xl bg-(--color-surface) text-center sm:w-[47%] sm:snap-start md:w-[31.5%] lg:w-auto lg:shrink ${
                block.image ? 'aspect-[2592/1448]' : 'h-44 px-4 sm:h-44'
              }`}
            >
              {block.image ? (
                <img
                  src={block.image}
                  alt={block.label}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-medium text-(--color-ink)">{block.label}</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      <div className="relative -mx-4 mt-1.5">
        <div className="rounded-2xl bg-(--color-surface) p-4">
          <Link to="/stats" className="flex flex-col gap-3">
            <h2 className="flex items-center gap-1.5 text-lg font-semibold text-(--color-ink)">
              Мои успехи
              <span className="text-(--color-brand-green)">›</span>
            </h2>

            <div className="grid w-full grid-cols-4 gap-2">
              {ranks.map((rank, i) => {
                const isCurrent = isAuthenticated && i === rankIndex
                const isLocked = !isAuthenticated || i > rankIndex
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

            <div className="mt-3 flex w-full flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold tracking-wide text-(--color-muted) uppercase">
                  Общий рейтинг
                </h3>
                {isAuthenticated && leaderboard.some((entry) => entry.email === email) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      scrollToMe()
                    }}
                    className="text-xs text-(--color-brand-green)"
                  >
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
          </Link>
        </div>
      </div>

      <Link
        to="/artifacts"
        onClick={playCoinSound}
        className="fixed right-4 bottom-20 z-40 h-14 w-14 shrink-0"
      >
        <img
          src="/artefakt.jpg"
          alt="Артефакты"
          className="h-full w-full animate-spin-slow rounded-full object-cover shadow-lg"
        />
      </Link>

      <div className="-mx-4 mt-1.5 flex flex-col gap-3 rounded-2xl bg-(--color-surface) p-4">
        <h2 className="text-sm font-normal text-(--color-ink)">Видео и аудиокниги</h2>
        <div className="no-scrollbar flex gap-3 overflow-x-auto">
          <Link to="/flashcards" className="w-28 shrink-0">
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl">
              <img src="/raskopki.png" alt="Раскопки" className="max-h-full max-w-full object-contain" />
            </div>
            <p className="mt-1 text-center text-xs font-normal text-(--color-ink)">Раскопки</p>
          </Link>
          <Link to="/flashcards" className="w-28 shrink-0">
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl">
              <img src="/Leon.png" alt="Леон II" className="max-h-full max-w-full object-contain" />
            </div>
            <p className="mt-1 text-center text-xs font-normal text-(--color-ink)">Леон II</p>
          </Link>
          <Link to="/flashcards" className="w-28 shrink-0">
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl">
              <img src="/abkhaz.png" alt="Акт независимости" className="max-h-full max-w-full object-contain" />
            </div>
            <p className="mt-1 text-center text-xs font-normal text-(--color-ink)">Акт независимости</p>
          </Link>
          <Link to="/flashcards" className="w-28 shrink-0">
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl">
              <img src="/russiaAbkh.png" alt="Россия — Абхазия" className="max-h-full max-w-full object-contain" />
            </div>
            <p className="mt-1 text-center text-xs font-normal text-(--color-ink)">Россия — Абхазия</p>
          </Link>
        </div>
      </div>

      <Link
        to="/exam"
        className="-mx-4 mt-1.5 flex h-[104px] items-start rounded-2xl bg-(--color-surface) p-4 text-xs font-light"
      >
        Наши партнёры
      </Link>
    </div>
  )
}
