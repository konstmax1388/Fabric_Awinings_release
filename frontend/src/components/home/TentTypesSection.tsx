import { Link } from 'react-router-dom'

const categories = [
  {
    title: 'Для грузового транспорта',
    slug: 'truck',
    img: 'https://images.unsplash.com/photo-1519003722824-cd6e866ed77c?w=600&q=80',
  },
  {
    title: 'Ангары и склады',
    slug: 'warehouse',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80',
  },
  {
    title: 'Кафе и террасы',
    slug: 'cafe',
    img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
  },
  {
    title: 'Мероприятия',
    slug: 'events',
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
  },
]

export function TentTypesSection() {
  return (
    <section className="bg-[#F5F0E8]/40 py-12 md:py-24">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
          Виды тентов
        </h2>
        <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">
          Выберите направление — в каталоге подберем конфигурацию под ваш объект.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/catalog?category=${c.slug}`}
              className="group overflow-hidden rounded-2xl bg-surface shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] transition hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.12)]"
            >
              <div className="aspect-[288/200] overflow-hidden">
                <img
                  src={c.img}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center gap-3 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-base font-heading text-lg text-secondary"
                  aria-hidden
                >
                  ◆
                </span>
                <span className="font-heading text-lg font-semibold italic text-text group-hover:text-accent">
                  {c.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
