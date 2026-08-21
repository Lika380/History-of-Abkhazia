import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function RequireAuth() {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()

  if (status === 'idle' || status === 'loading') {
    return <p className="text-(--color-muted)">Загрузка…</p>
  }

  if (status === 'network_error') {
    return (
      <p className="text-(--color-brand-red)">
        Не удалось подключиться к серверу. Обновите страницу и попробуйте снова.
      </p>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
