import { Link } from 'react-router-dom'

const heroBg =
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[24px] md:mx-6 lg:mx-auto lg:max-w-[1280px]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/85 via-[#1a1a1a]/55 to-transparent" />
      <div className="relative px-4 py-16 md:px-10 md:py-24 lg:py-28">
        <div className="max-w-2xl">
          <h1 className="font-heading text-4xl font-black tracking-tight text-surface md:text-5xl lg:text-7xl">
            Тенты на заказ
          </h1>
          <p className="mt-4 font-body text-lg text-surface/90 md:text-xl">
            Любая форма и размер: от навесов для техники до тентов для мероприятий. Своё производство —
            сроки и цена под контролем.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/#calculator"
              className="inline-flex h-14 min-h-[44px] items-center justify-center rounded-[40px] bg-accent px-8 font-body text-base font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.35)] transition hover:scale-[1.02] hover:bg-[#c65f00]"
              style={{ letterSpacing: '0.02em' }}
            >
              Рассчитать стоимость
            </Link>
            <Link
              to="/catalog"
              className="inline-flex h-14 min-h-[44px] items-center justify-center rounded-[40px] border-2 border-surface/80 bg-transparent px-8 font-body text-base font-medium text-surface transition hover:bg-surface/10"
              style={{ letterSpacing: '0.02em' }}
            >
              Смотреть каталог
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
