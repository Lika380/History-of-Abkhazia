export default function Splash() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 bg-(--color-surface-alt)">
      <img src="/artefakt.jpg" alt="" className="h-16 w-16 animate-spin-slow rounded-full object-cover shadow-lg" />
      <p className="text-center text-sm font-normal text-(--color-ink)">Загрузка...</p>
    </div>
  )
}
