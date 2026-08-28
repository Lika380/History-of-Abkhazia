import { useState } from 'react'
import { Link } from 'react-router-dom'
import videos from '../data/videos.json'

export default function Media() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-xl text-(--color-brand-green)">‹</span>
        <h1 className="text-xl font-semibold text-(--color-ink)">Видео и аудиокниги</h1>
      </Link>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {videos.map((video) => (
          <button
            key={video.id}
            onClick={() => setOpenId(video.id === openId ? null : video.id)}
            className="flex flex-col gap-2 rounded-2xl bg-(--color-surface) p-3 text-left"
          >
            <div className="flex h-32 items-center justify-center overflow-hidden rounded-xl">
              <img src={video.image} alt={video.title} className="max-h-full max-w-full object-contain" />
            </div>
            <p className="text-center text-sm font-normal text-(--color-ink)">{video.title}</p>
            {openId === video.id && (
              <p className="text-center text-xs text-(--color-muted)">Видеоматериал скоро появится</p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
