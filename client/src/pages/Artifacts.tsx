import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import artifacts from '../data/artifacts.json'
import { useCoinSound } from '../hooks/useCoinSound'

export default function Artifacts() {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [coins, setCoins] = useState(0)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const { playCoinSound } = useCoinSound()

  useEffect(() => {
    api.getArtifacts().then(({ unlockedIds, coins }) => {
      setUnlockedIds(new Set(unlockedIds))
      setCoins(coins)
    })
  }, [])

  async function handleBuy(artifactId: string) {
    if (coins <= 0 || buyingId) return
    setBuyingId(artifactId)
    try {
      await api.unlockArtifact(artifactId)
      setUnlockedIds((prev) => new Set(prev).add(artifactId))
      setCoins((c) => c - 1)
      playCoinSound()
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-xl text-(--color-brand-green)">‹</span>
        <h1 className="text-xl font-semibold text-(--color-ink)">Артефакты</h1>
      </Link>
      <p className="text-(--color-muted)">
        Монет: {coins}. За каждый тест без ошибок — 1 монета, тратьте на любой артефакт.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {artifacts.map((artifact) => {
          const unlocked = unlockedIds.has(artifact.id)
          const canBuy = !unlocked && coins > 0 && buyingId === null
          return (
            <button
              key={artifact.id}
              onClick={() => !unlocked && handleBuy(artifact.id)}
              disabled={unlocked || buyingId !== null}
              className={`relative flex flex-col items-center gap-1 overflow-hidden rounded-xl bg-(--color-surface) p-2 text-center ${
                canBuy ? 'cursor-pointer' : unlocked ? '' : 'cursor-default opacity-70'
              }`}
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
                  {canBuy ? (
                    <span className="text-lg">🪙</span>
                  ) : (
                    <img src="/key.webp" alt="" className="h-6 w-6 object-contain" />
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
