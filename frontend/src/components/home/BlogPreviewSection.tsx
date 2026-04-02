import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'

const posts = [
  {
    slug: 'kak-vybrat-material',
    title: 'Как выбрать материал для тента: ПВХ или ткань',
    excerpt: 'Сравниваем срок службы, уход и применение для транспорта и стационарных навесов.',
    date: '28.03.2026',
    img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80',
  },
  {
    slug: 'zamer-svoimi-rukami',
    title: 'Замер тента своими руками: чек-лист',
    excerpt: 'Что снять с объекта, чтобы мы подготовили КП без выезда.',
    date: '15.03.2026',
    img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80',
  },
  {
    slug: 'ustanovka-zimoj',
    title: 'Монтаж зимой: когда это возможно',
    excerpt: 'Температура, ветер и крепления — что учитываем при зимнем монтаже.',
    date: '02.03.2026',
    img: 'https://images.unsplash.com/photo-1519003722824-cd6e866ed77c?w=600&q=80',
  },
]

export function BlogPreviewSection() {
  const reduce = useReducedMotion()

  return (
    <section className="bg-[#F5F0E8]/40 py-12 md:py-24">
      <motion.div
        className="mx-auto max-w-[1280px] px-4 md:px-6"
        initial={reduce ? false : fadeUpHidden}
        whileInView={reduce ? undefined : fadeUpVisible}
        viewport={{ once: true, amount: 0.08 }}
        transition={easeOutSoft}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
              Блог
            </h2>
            <p className="mt-3 font-body text-text-muted md:text-lg">
              Полезные материалы для заказчиков и эксплуатации тентов.
            </p>
          </div>
          <motion.span whileHover={reduce ? undefined : { x: 4 }} className="inline-block">
            <Link to="/blog" className="font-body font-medium text-accent hover:underline">
              Все статьи →
            </Link>
          </motion.span>
        </div>

        <motion.div
          className="mt-10 grid gap-6 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {posts.map((post) => (
            <motion.article
              key={post.slug}
              variants={staggerItem}
              whileHover={
                reduce
                  ? undefined
                  : {
                      scale: 1.03,
                      y: -4,
                      boxShadow: '0 16px 32px -12px rgba(0,0,0,0.12)',
                    }
              }
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="overflow-hidden rounded-2xl bg-surface shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)]"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img src={post.img} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <time className="font-body text-xs text-text-subtle" dateTime={post.date}>
                  {post.date}
                </time>
                <h3 className="mt-2 font-heading text-xl font-semibold text-text">{post.title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-text-muted">
                  {post.excerpt}
                </p>
                <Link
                  to={`/blog/${post.slug}`}
                  className="mt-4 inline-block font-body text-sm font-medium text-accent hover:underline"
                >
                  Читать далее
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
