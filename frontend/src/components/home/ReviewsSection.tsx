import { useState } from 'react'

const reviews = [
  {
    id: '1',
    name: 'Игорь С.',
    text: 'Заказывали тент на полуприцеп. Сроки выдержали, качество швов отличное — через зиму всё ок.',
    rating: 5,
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&q=80',
    video: null as string | null,
  },
  {
    id: '2',
    name: 'ООО «Логистик»',
    text: 'Навес для площадки 400 м². Документы для бухгалтерии, монтаж без простоя погрузки.',
    rating: 5,
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&q=80',
    video: 'https://example.com/video',
  },
  {
    id: '3',
    name: 'Анна М.',
    text: 'Терраса для кофейни — красиво и не шумно в дождь. Гости отмечают.',
    rating: 5,
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&q=80',
    video: null,
  },
]

export function ReviewsSection() {
  const [i, setI] = useState(0)
  const r = reviews[i]

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 md:py-24">
      <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
        Отзывы клиентов
      </h2>
      <p className="mt-3 font-body text-text-muted md:text-lg">
        Реальные заказчики B2B и частные лица.
      </p>

      <div className="relative mt-10">
        <article className="mx-auto max-w-[400px] rounded-2xl border border-border-light bg-[#F5F0E8] p-6 md:bg-surface md:p-8">
          <div className="flex items-start gap-4">
            <img
              src={r.photo}
              alt=""
              className="h-20 w-20 shrink-0 rounded-full object-cover"
            />
            <div>
              <p className="font-body text-lg font-semibold text-text">{r.name}</p>
              <div className="mt-1 flex gap-0.5" aria-label={`Оценка ${r.rating} из 5`}>
                {Array.from({ length: 5 }, (_, k) => (
                  <span key={k} className={k < r.rating ? 'text-amber-500' : 'text-border'}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-6 font-body text-base italic leading-relaxed text-text-muted">
            «{r.text}»
          </p>
          {r.video && (
            <div className="relative mt-6 aspect-video overflow-hidden rounded-xl bg-text/10">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/90 text-surface">
                  ▶
                </span>
              </div>
              <p className="absolute bottom-2 left-2 font-body text-xs text-text-muted">
                Видеоотзыв (ссылка из админки)
              </p>
            </div>
          )}
        </article>

        <div className="mt-8 flex justify-center gap-2">
          {reviews.map((_, idx) => (
            <button
              key={reviews[idx].id}
              type="button"
              onClick={() => setI(idx)}
              className={`h-2.5 w-2.5 rounded-full transition ${idx === i ? 'bg-accent' : 'bg-border'}`}
              aria-label={`Отзыв ${idx + 1}`}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-4">
          <button
            type="button"
            className="rounded-full border border-border px-4 py-2 font-body text-sm hover:border-accent"
            onClick={() => setI((v) => (v - 1 + reviews.length) % reviews.length)}
          >
            Назад
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-4 py-2 font-body text-sm hover:border-accent"
            onClick={() => setI((v) => (v + 1) % reviews.length)}
          >
            Далее
          </button>
        </div>
      </div>
    </section>
  )
}
