const items = [
  { problem: 'Дорого?', solution: 'Своё производство — на 30% дешевле типовых предложений.', icon: '₽' },
  { problem: 'Долго ждать?', solution: 'Изготовление от 5 рабочих дней, срочные заказы — по договорённости.', icon: '⏱' },
  { problem: 'Ненадёжно?', solution: 'Гарантия на материалы и фурнитуру, договор и акты.', icon: '✓' },
  { problem: 'Сложно с замером?', solution: 'Выезд специалиста или инструкция для самостоятельного замера.', icon: '📐' },
]

export function ProblemSolutionSection() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 md:py-24">
      <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
        Решаем ваши задачи
      </h2>
      <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">
        Частые вопросы клиентов — и как мы на них отвечаем делом, а не обещаниями.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((card) => (
          <article
            key={card.problem}
            className="rounded-2xl border border-border-light bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.12)]"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F5F0E8] font-heading text-xl text-secondary"
              aria-hidden
            >
              {card.icon}
            </span>
            <h3 className="mt-4 font-heading text-xl font-semibold italic text-text">{card.problem}</h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-text-muted md:text-base">
              {card.solution}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
