import { useEffect, useState } from 'react'

const RUN_FRAMES = ['/introPerson80.webp', '/introPerson94.webp', '/introPerson84.webp', '/introPerson95.webp']
const FRAME_INTERVAL_MS = 120

export default function Splash() {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % RUN_FRAMES.length)
    }, FRAME_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4" style={{ backgroundColor: '#FFFFFF' }}>
      <img src={RUN_FRAMES[frame]} alt="" className="h-16 w-16 object-contain" />
      <p className="text-center text-sm font-normal text-(--color-ink)">Загрузка...</p>
    </div>
  )
}
