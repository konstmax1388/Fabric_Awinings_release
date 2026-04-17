import { Link } from 'react-router-dom'
import { OptimizedImage } from '../ui/OptimizedImage'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { useCart } from '../../hooks/useCart'
import { cartLineImageFrameClass } from '../../lib/productPhotoAspect'

function formatRub(n: number) {
  return `${n.toLocaleString('ru-RU')} ₽`
}

function pluralPositions(n: number): string {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return 'позиция'
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 > 20)) return 'позиции'
  return 'позиций'
}

/** Состав корзины; оформление — на `/checkout`. */
export function CartView() {
  const { items, removeLine, setQty, totalQty, totalApprox } = useCart()
  const { productPhotoAspect } = useSiteSettings()

  return (
    <div className="mx-auto w-full max-w-5xl flex-1">
      <h1 className="font-heading text-2xl font-semibold text-text md:text-3xl">Корзина</h1>
      <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-text-muted">
        Здесь только выбранные позиции. Ориентировочная сумма по ценам из каталога; точную стоимость согласуем
        после замера или по вашим размерам.
      </p>

      <div className="mt-8 flex min-h-0 flex-1 flex-col">
        {items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-light bg-bg-base px-6 py-16 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-border-light/60 text-text-muted"
              aria-hidden
            >
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2 3h2l.4 2M16 13a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4zm8 0h2l1.2-6H5.4M6 9h12l-1.2 6"
                />
              </svg>
            </div>
            <p className="mt-6 font-heading text-lg font-semibold text-text">В корзине пока пусто</p>
            <p className="mt-2 max-w-sm font-body text-sm text-text-muted">
              Перейдите в каталог и добавьте тенты или навесы — кнопка «В корзину» на карточке товара.
            </p>
            <Link
              to="/catalog"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-[40px] bg-accent px-8 font-body text-sm font-medium text-surface"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
            <div className="min-w-0 flex-1">
              <h2 className="font-body text-sm font-semibold uppercase tracking-wide text-text-subtle">
                Товары · {totalQty} {pluralPositions(totalQty)}
              </h2>
              <ul className="mt-4 flex flex-col divide-y divide-border-light rounded-2xl border border-border-light bg-surface">
                {items.map((line) => {
                  const lineApprox = line.priceFrom * line.qty
                  return (
                    <li key={line.lineId} className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5">
                      <Link
                        to={`/catalog/${line.slug}`}
                        className={cartLineImageFrameClass(productPhotoAspect)}
                      >
                        {line.image ? (
                          <OptimizedImage
                            src={line.image}
                            alt=""
                            widths={[160, 320, 480]}
                            sizes="96px"
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center font-body text-xs text-text-subtle">
                            Нет фото
                          </span>
                        )}
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="min-w-0">
                            <Link
                              to={`/catalog/${line.slug}`}
                              className="font-body text-base font-semibold text-text hover:text-accent"
                            >
                              {line.title}
                            </Link>
                            <p className="mt-1 font-body text-sm text-text-muted">
                              Цена в каталоге — {formatRub(line.priceFrom)} за единицу
                            </p>
                          </div>
                          <p className="shrink-0 font-heading text-base font-semibold text-text sm:text-right">
                            ≈ {formatRub(lineApprox)}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <span className="font-body text-xs text-text-subtle">Количество</span>
                          <div className="inline-flex items-center rounded-xl border border-border bg-bg-base p-0.5">
                            <button
                              type="button"
                              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg leading-none text-text hover:bg-surface"
                              onClick={() =>
                                line.qty <= 1 ? removeLine(line.lineId) : setQty(line.lineId, line.qty - 1)
                              }
                              aria-label={line.qty <= 1 ? 'Удалить позицию из корзины' : 'Уменьшить количество'}
                            >
                              −
                            </button>
                            <span className="min-w-[2.5rem] text-center font-body text-sm font-semibold tabular-nums text-text">
                              {line.qty}
                            </span>
                            <button
                              type="button"
                              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg leading-none text-text hover:bg-surface"
                              onClick={() => setQty(line.lineId, line.qty + 1)}
                              aria-label="Увеличить количество"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(line.lineId)}
                            className="ml-auto font-body text-sm text-text-muted underline-offset-2 hover:text-accent hover:underline sm:ml-0"
                          >
                            Убрать из корзины
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <Link
                to="/catalog"
                className="mt-4 inline-flex items-center font-body text-sm font-medium text-accent hover:underline"
              >
                ← Добавить ещё из каталога
              </Link>
            </div>

            <aside className="lg:sticky lg:top-24 lg:w-full lg:max-w-sm lg:shrink-0">
              <div className="rounded-2xl border border-border-light bg-bg-base p-5 shadow-sm">
                <h2 className="font-heading text-lg font-semibold text-text">Итого</h2>
                <dl className="mt-4 space-y-3 font-body text-sm">
                  <div className="flex justify-between gap-4 text-text-muted">
                    <dt>Позиций в заказе</dt>
                    <dd className="font-medium tabular-nums text-text">{totalQty}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-border-light pt-3">
                    <dt className="font-medium text-text">Ориентировочно</dt>
                    <dd className="font-heading text-xl font-semibold tabular-nums text-text">
                      {formatRub(totalApprox)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 rounded-xl bg-surface p-3 font-body text-xs leading-relaxed text-text-muted">
                  Итоговая сумма появится в коммерческом предложении после уточнения размеров и комплектации.
                </p>
                <Link
                  to="/checkout"
                  className="mt-5 flex h-12 w-full items-center justify-center rounded-[40px] bg-accent font-body text-sm font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)] transition-colors hover:bg-[#c65f00]"
                >
                  Оформить заказ
                </Link>
                <p className="mt-3 text-center font-body text-xs text-text-subtle">
                  Далее — контакты и адрес доставки, без онлайн-оплаты на сайте.
                </p>
                <p className="mt-2 text-center font-body text-xs leading-relaxed text-text-subtle">
                  Оформление заказа регулируется{' '}
                  <Link to="/offer" className="text-accent hover:underline">
                    публичной офертой
                  </Link>{' '}
                  и{' '}
                  <Link to="/privacy" className="text-accent hover:underline">
                    политикой конфиденциальности
                  </Link>
                  .
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
