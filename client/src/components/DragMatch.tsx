import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

export interface DragMatchPair {
  id: string
  term: string
  definition: string
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function DragMatch({
  pairs,
  onComplete,
  onWrong,
}: {
  pairs: DragMatchPair[]
  onComplete?: () => void
  onWrong?: () => void
}) {
  const [defOrder] = useState(() => shuffle(pairs.map((p) => p.id)))
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [wrongId, setWrongId] = useState<string | null>(null)
  const dropRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const allMatched = matched.size === pairs.length

  function handlePointerDown(e: ReactPointerEvent, id: string) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setDragId(id)
    setDragPos({ x: e.clientX, y: e.clientY })
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (!dragId) return
    setDragPos({ x: e.clientX, y: e.clientY })
  }

  function endDrag(x: number, y: number) {
    if (!dragId) return
    let droppedOn: string | null = null
    for (const [defId, el] of Object.entries(dropRefs.current)) {
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        droppedOn = defId
        break
      }
    }
    if (droppedOn === dragId) {
      const next = new Set(matched).add(dragId)
      setMatched(next)
      if (next.size === pairs.length) onComplete?.()
    } else if (droppedOn) {
      setWrongId(dragId)
      onWrong?.()
      setTimeout(() => setWrongId(null), 400)
    }
    setDragId(null)
    setDragPos(null)
    setDragOffset(null)
  }

  function handlePointerUp(e: ReactPointerEvent) {
    endDrag(e.clientX, e.clientY)
  }

  const draggedPair = dragId ? pairs.find((p) => p.id === dragId) : undefined

  return (
    <div className="flex flex-col gap-4">
      {allMatched ? (
        <p className="rounded-xl bg-(--color-brand-green-light) p-3 text-center font-medium text-(--color-brand-green)">
          Готово! Все пары найдены
        </p>
      ) : (
        <p className="text-sm text-(--color-muted)">Перетащите термин к его определению</p>
      )}

      <div className="flex flex-wrap gap-2">
        {pairs.map((p) => {
          const isMatched = matched.has(p.id)
          const isDragging = dragId === p.id
          return (
            <div
              key={p.id}
              onPointerDown={isMatched ? undefined : (e) => handlePointerDown(e, p.id)}
              onPointerMove={isMatched ? undefined : handlePointerMove}
              onPointerUp={isMatched ? undefined : handlePointerUp}
              onPointerCancel={
                isMatched
                  ? undefined
                  : () => {
                      setDragId(null)
                      setDragPos(null)
                      setDragOffset(null)
                    }
              }
              className={`touch-none rounded-xl border px-3 py-2 text-sm font-medium select-none ${
                isMatched || isDragging
                  ? 'pointer-events-none opacity-0'
                  : wrongId === p.id
                    ? 'border-(--color-brand-red) bg-(--color-brand-red-light)'
                    : 'border-(--color-brand-green) bg-(--color-brand-green-light)'
              } text-(--color-ink)`}
            >
              {p.term}
            </div>
          )
        })}
      </div>

      {draggedPair && dragPos && dragOffset && (
        <div
          className="fixed z-50 touch-none rounded-xl border border-(--color-brand-green) bg-(--color-brand-green-light) px-3 py-2 text-sm font-medium text-(--color-ink) shadow-lg select-none"
          style={{
            left: dragPos.x - dragOffset.x,
            top: dragPos.y - dragOffset.y,
            pointerEvents: 'none',
          }}
        >
          {draggedPair.term}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {defOrder.map((defId) => {
          const pair = pairs.find((p) => p.id === defId)!
          const isMatched = matched.has(defId)
          return (
            <div
              key={defId}
              ref={(el) => {
                dropRefs.current[defId] = el
              }}
              className={`rounded-xl border p-3 text-sm ${
                isMatched
                  ? 'border-(--color-brand-green) bg-(--color-brand-green-light) text-(--color-ink)'
                  : 'border-dashed border-(--color-border) text-(--color-muted)'
              }`}
            >
              {isMatched && <span className="font-medium text-(--color-ink)">{pair.term} — </span>}
              {pair.definition}
            </div>
          )
        })}
      </div>
    </div>
  )
}
