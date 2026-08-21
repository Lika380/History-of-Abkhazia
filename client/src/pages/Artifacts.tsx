import { useState } from 'react'
import artifacts from '../data/artifacts.json'

export default function Artifacts() {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(() => new Set([artifacts[0].id]))

  const handleClick = (id: string, unlocked: boolean) => {
    if (!unlocked) {
      setUnlockedIds((prev) => new Set(prev).add(id))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-(--color-ink)">Артефакты</h1>
      <p className="text-(--color-muted)">
        Открыто {unlockedIds.size} из {artifacts.length}. Проходите темы, чтобы открывать новые артефакты.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {artifacts.map((artifact) => {
          const unlocked = unlockedIds.has(artifact.id)
          return (
            <div
              key={artifact.id}
              onClick={() => handleClick(artifact.id, unlocked)}
              className="relative flex cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-xl bg-(--color-surface) p-2 text-center"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-(--color-surface-alt) text-2xl ${
                  unlocked ? '' : 'blur-sm'
                }`}
              >
                {artifact.icon}
              </div>
              <p className={`text-xs font-medium text-(--color-ink) ${unlocked ? '' : 'blur-sm'}`}>
                {artifact.title}
              </p>

              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-(--color-surface)/60">
                  <span className="text-lg">🔒</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
