import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { useAuth } from '../../context/AuthContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-xl px-4 py-2.5 font-body text-sm font-medium transition-colors ${
    isActive ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-bg-base hover:text-text'
  }`

export function AccountLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (user?.passwordChangeBlocking && location.pathname !== '/account/change-password') {
    return <Navigate to="/account/change-password" replace />
  }

  const deadline = user?.passwordChangeDeadline
  const showDeadlineHint = Boolean(deadline && !user?.passwordChangeBlocking)

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
        <nav className="font-body text-sm text-text-muted">
          <NavLink to="/" className="hover:text-accent">
            Главная
          </NavLink>
          <span className="mx-2">/</span>
          <span className="text-text">Личный кабинет</span>
        </nav>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-12">
          <aside className="shrink-0 lg:w-56">
            <p className="mb-3 font-body text-xs uppercase tracking-wide text-text-subtle">Меню</p>
            <nav className="flex flex-col gap-1 border border-border-light rounded-2xl bg-bg-base p-2">
              <NavLink to="/account/orders" className={linkClass} end>
                Мои заказы
              </NavLink>
              <NavLink to="/account/profile" className={linkClass}>
                Профиль
              </NavLink>
              <NavLink to="/account/addresses" className={linkClass}>
                Адреса доставки
              </NavLink>
              <NavLink to="/account/change-password" className={linkClass}>
                Смена пароля
              </NavLink>
            </nav>
            <div className="mt-4 rounded-2xl border border-border-light bg-bg-base p-4">
              <p className="font-body text-xs text-text-muted">Вы вошли как</p>
              <p className="mt-1 truncate font-body text-sm font-medium text-text">{user?.email}</p>
              <button
                type="button"
                onClick={() => logout()}
                className="mt-3 font-body text-sm text-accent hover:underline"
              >
                Выйти
              </button>
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            {showDeadlineHint ? (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-body text-sm text-amber-950">
                Войдите с временным паролем из письма и{' '}
                <NavLink to="/account/change-password" className="font-medium text-accent underline">
                  смените пароль
                </NavLink>{' '}
                до{' '}
                {new Date(deadline!).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                , иначе доступ к заказам будет ограничен.
              </div>
            ) : null}
            <Outlet />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
