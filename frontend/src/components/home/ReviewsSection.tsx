import { motion, useReducedMotion } from 'framer-motion'
import {
  easeOutSoft,
  fadeUpHidden,
  fadeUpVisible,
  staggerContainer,
  staggerItem,
} from '../../lib/motion-presets'

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
  {
    id: '4',
    name: 'Дмитрий К.',
    text: 'Тент на раму для пикапа — сделали по фото и размерам кузова, приехал без второго рейса. Рекомендую.',
    rating: 5,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80',
    video: null,
  },
  {
    id: '5',
    name: 'ИП «СтройПлюс»',
    text: 'Временный ангар на объекте: согласовали КП за день, через неделю уже стоял каркас с полотном.',
    rating: 5,
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&q=80',
    video: null,
  },
  {
    id: '6',
    name: 'Елена В.',
    text: 'Навес у частного дома — аккуратный монтаж, не испортили плитку на террасе. Цена как в смете.',
    rating: 5,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286ad2?w=160&q=80',
    video: null,
  },
  {
    id: '7',
    name: 'Сергей П.',
    text: 'Срочно восстановили полотно после порыва ветра. Выехали на следующий день, за выходные закрыли объект.',
    rating: 5,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80',
    video: null,
  },
  {
    id: '8',
    name: 'Мария Л.',
    text: 'Отправила замеры по чек-листу с сайта — прислали коммерческое без выезда. Потом уже приехали на финальный замер.',
    rating: 5,
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a21a?w=160&q=80',
    video: null,
  },
]

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Оценка ${rating} из 5`}>
      {Array.from({ length: 5 }, (_, k) => (
        <span key={k} className={k < rating ? 'text-amber-500' : 'text-border'}>
          ★
        </span>
      ))}
    </div>
  )
}

export function ReviewsSection() {
  const reduce = useReducedMotion()

  return (
    <motion.section
      className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.08 }}
      transition={easeOutSoft}
    >
      <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
        Отзывы клиентов
      </h2>
      <p className="mt-3 font-body text-text-muted md:text-lg">
        Реальные заказчики B2B и частные лица.
      </p>

      <motion.div
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
      >
        {reviews.map((r) => (
          <motion.article
            key={r.id}
            variants={staggerItem}
            whileHover={
              reduce
                ? undefined
                : {
                    y: -4,
                    boxShadow: '0 16px 32px -12px rgba(0,0,0,0.12)',
                  }
            }
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex h-full flex-col rounded-2xl border border-border-light bg-[#F5F0E8] p-5 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] md:bg-surface md:p-6"
          >
            <div className="flex items-start gap-3">
              <img
                src={r.photo}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full object-cover md:h-16 md:w-16"
              />
              <div className="min-w-0 flex-1">
                <p className="font-body text-base font-semibold leading-snug text-text">{r.name}</p>
                <div className="mt-1">
                  <Stars rating={r.rating} />
                </div>
              </div>
            </div>
            <p className="mt-4 flex-1 font-body text-sm italic leading-relaxed text-text-muted md:text-[15px]">
              «{r.text}»
            </p>
            {r.video && (
              <div className="relative mt-4 aspect-video overflow-hidden rounded-xl bg-text/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/90 text-surface shadow-md">
                    ▶
                  </span>
                </div>
                <p className="absolute bottom-1.5 left-2 font-body text-[11px] text-text-muted">
                  Видеоотзыв
                </p>
              </div>
            )}
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  )
}
