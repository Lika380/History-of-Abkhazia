import { Link } from 'react-router-dom'
import { useRatingStore } from '../store/rating'
import { useCharacterStore } from '../store/character'
import { useAuthStore } from '../store/auth'
import CharacterAvatar from '../components/CharacterAvatar'
import ranks from '../data/ranks.json'
import videos from '../data/videos.json'
import { useCoinSound } from '../hooks/useCoinSound'

const blocks = [
  { id: 1, label: 'Первобытнообщинный строй и раннеклассовые образования', image: '/slide1.webp' },
  { id: 2, label: 'Эпоха феодализма', image: '/slide2.webp' },
  { id: 3, label: 'Новое время', image: '/slide3.webp' },
  { id: 4, label: 'Советское и постсоветское время', image: '/slide4.webp' },
]

export default function Home() {
  const leaderboard = useRatingStore((s) => s.leaderboard)
  const characterId = useCharacterStore((s) => s.characterId)
  const avatar = useCharacterStore((s) => s.avatar)
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated')
  const userName = useAuthStore((s) => s.user?.name)
  const { playCoinSound } = useCoinSound()

  const rankIndex = 0

  return (
    <div className="flex flex-col">
      <section className="-mx-4 -mt-6 rounded-b-2xl bg-(--color-surface) px-4 pt-4 pb-2">
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[3%] pb-1 sm:mx-0 sm:snap-start sm:px-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:snap-none">
          {blocks.map((block) => (
            <Link
              key={block.id}
              to={`/flashcards#section-${block.id - 1}`}
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
                        <CharacterAvatar
                          name={userName || '?'}
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
          </Link>
        </div>
      </div>

      <div className="-mx-4 mt-1.5 flex flex-col gap-3 rounded-2xl bg-(--color-surface) p-4">
        <Link to="/rating" className="flex items-center gap-1.5 text-sm font-normal text-(--color-ink)">
          <h2>Общий рейтинг</h2>
          <span className="text-(--color-brand-green)">›</span>
        </Link>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-(--color-muted)">Пока никто не прошёл ни одного теста.</p>
        ) : (
          <ol className="flex max-h-24 flex-col gap-1 overflow-y-auto">
            {leaderboard.map((entry) => (
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

      <Link
        to="/artifacts"
        onClick={playCoinSound}
        className="fixed right-4 bottom-20 z-40 h-14 w-14 shrink-0"
      >
        <img
          src="/artefakt.webp"
          alt="Артефакты"
          className="h-full w-full animate-spin-slow rounded-full object-cover shadow-lg"
        />
      </Link>

      <div className="-mx-4 mt-1.5 flex flex-col gap-3 rounded-2xl bg-(--color-surface) p-4">
        <Link to="/media" className="flex items-center gap-1.5 text-sm font-normal text-(--color-ink)">
          <h2>Видео и аудиокниги</h2>
          <span className="text-(--color-brand-green)">›</span>
        </Link>
        <div className="no-scrollbar flex gap-3 overflow-x-auto">
          {videos.map((video) => (
            <Link key={video.id} to="/media" className="w-28 shrink-0">
              <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl">
                <img src={video.image} alt={video.title} className="max-h-full max-w-full object-contain" />
              </div>
              <p className="mt-1 text-center text-xs font-normal text-(--color-ink)">{video.title}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="-mx-4 mt-1.5 flex h-[104px] items-start rounded-2xl bg-(--color-surface) p-4 text-xs font-light">
        Наши партнёры
      </div>
    </div>
  )
}
