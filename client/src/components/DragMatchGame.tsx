import { useMemo, useState } from 'react'
import DragMatch, { type DragMatchPair } from './DragMatch'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function DragMatchGame({
  pool,
  rounds,
  pairsPerRound,
  maxMistakes,
}: {
  pool: DragMatchPair[]
  rounds: number
  pairsPerRound: number
  maxMistakes: number
}) {
  const [roundIndex, setRoundIndex] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [runId, setRunId] = useState(0)
  const [blockDone, setBlockDone] = useState(false)

  const roundPairs = useMemo(() => shuffle(pool).slice(0, pairsPerRound), [pool, pairsPerRound, roundIndex, runId])

  function handleWrong() {
    setMistakes((m) => {
      const next = m + 1
      if (next >= maxMistakes) {
        setRoundIndex(0)
        setRunId((r) => r + 1)
        return 0
      }
      return next
    })
  }

  function handleRoundComplete() {
    if (roundIndex + 1 >= rounds) {
      setBlockDone(true)
    } else {
      setRoundIndex((r) => r + 1)
    }
  }

  if (blockDone) {
    return (
      <p className="rounded-xl bg-(--color-brand-green-light) p-3 text-center font-medium text-(--color-brand-green)">
        Блок пройден! Все {rounds} раундов позади 🎉
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-(--color-muted)">
        <span>
          Раунд {roundIndex + 1} из {rounds}
        </span>
        <span>
          Ошибок: {mistakes} из {maxMistakes}
        </span>
      </div>
      <DragMatch key={`${roundIndex}-${runId}`} pairs={roundPairs} onComplete={handleRoundComplete} onWrong={handleWrong} />
    </div>
  )
}
