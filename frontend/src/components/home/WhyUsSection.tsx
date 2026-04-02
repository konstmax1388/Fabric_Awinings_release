const cols = [
  {
    title: 'Своё производство',
    text: 'Полный цикл: проектирование, раскрой, сварка и монтаж своими бригадами.',
    icon: '🏭',
  },
  {
    title: 'Материалы в наличии',
    text: 'ПВХ, ткани, фурнитура от проверенных поставщиков — без месяцев ожидания.',
    icon: '📦',
  },
  {
    title: 'Договор и гарантия',
    text: 'Фиксируем сроки и объём работ. Документы для B2B и тендеров.',
    icon: '📋',
  },
  {
    title: 'Поддержка после монтажа',
    text: 'Консультации по уходу, ремонт и доработки по запросу.',
    icon: '🛠',
  },
]

export function WhyUsSection() {
  return (
    <section className="bg-[#F5F0E8]/40 py-12 md:py-24">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
          Почему выбирают нас
        </h2>
        <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">
          Работаем прозрачно: вы знаете этапы, сроки и ответственных.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title} className="rounded-2xl bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)]">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-base text-2xl"
                aria-hidden
              >
                {c.icon}
              </span>
              <h3 className="mt-4 font-heading text-xl font-semibold text-text">{c.title}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-text-muted md:text-base">
                {c.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
