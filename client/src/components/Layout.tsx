import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Главная', end: true, icon: '/icons/icon3.webp' },
  { to: '/flashcards', label: 'Материал', icon: '/icons/icon4.webp' },
  { to: '/dates', label: 'Даты', icon: '/icons/icon1.webp' },
  { to: '/exam', label: 'Тренажер', icon: '/icons/icon2.webp' },
  { to: '/stats', label: 'Профиль', icon: '/icons/icon5.webp' },
]

export default function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 border-t border-(--color-border) bg-(--color-surface) print:hidden">
        <div className="mx-auto flex max-w-6xl">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 px-2 py-3 text-center text-[9px] font-normal ${
                  isActive
                    ? 'text-(--color-brand-green)'
                    : 'text-(--color-ink)'
                }`
              }
            >
              <span
                aria-hidden="true"
                className="h-5 w-5 bg-current"
                style={{
                  maskImage: `url(${item.icon})`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskImage: `url(${item.icon})`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                }}
              />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
