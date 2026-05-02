import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { fetchBlogPosts, type BlogListItem } from '../../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'
import { OptimizedImage } from '../ui/OptimizedImage'

export function BlogPreviewSection() {
  const reduce = useReducedMotion()
  const { home } = useSiteSettings()
  const bl = home?.blog
  const heading = bl?.heading ?? 'Блог'
  const subheading =
    bl?.subheading ?? 'Полезные материалы для заказчиков и эксплуатации тентов.'
  const allLink = bl?.allLink ?? 'Все статьи →'
  const readMore = bl?.readMore ?? 'Читать далее'
  const loadingText = bl?.loading ?? 'Загрузка блога…'

  const [posts, setPosts] = useState<BlogListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchBlogPosts().then((list) => {
      if (!cancelled) {
        setPosts(list.slice(0, 3))
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className="bg-[#F5F0E8]/40 py-12 md:py-24">
        <div className="fabric-container min-w-0">
          <p className="font-body text-text-muted">{loadingText}</p>
        </div>
      </section>
    )
  }

  if (posts.length === 0) return null

  return (
    <section className="bg-[#F5F0E8]/40 py-12 md:py-24">
      <motion.div
        className="fabric-container min-w-0"
        initial={reduce ? false : fadeUpHidden}
        whileInView={reduce ? undefined : fadeUpVisible}
        viewport={{ once: true, amount: 0.08 }}
        transition={easeOutSoft}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">{heading}</h2>
            <p className="mt-3 font-body text-text-muted md:text-lg">{subheading}</p>
          </div>
          <motion.span whileHover={reduce ? undefined : { x: 4 }} className="inline-block">
            <Link to="/blog" className="font-body font-medium text-accent hover:underline">
              {allLink}
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
                      y: -6,
                      boxShadow: '0 20px 40px -14px rgba(0,0,0,0.14)',
                    }
              }
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="group overflow-hidden rounded-2xl bg-surface shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] transition-shadow duration-300 hover:ring-accent/15"
            >
              <Link
                to={`/blog/${post.slug}`}
                className="relative block aspect-[16/10] w-full overflow-hidden bg-border-light/25 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              >
                {post.img ? (
                  <>
                    <OptimizedImage
                      src={post.img}
                      alt={post.title}
                      widths={[480, 640, 800, 960]}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="h-full w-full object-cover transition-[transform,filter] duration-500 ease-out will-change-transform motion-safe:group-hover:scale-[1.06] motion-reduce:transition-none"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-0 transition-opacity duration-300 motion-safe:group-hover:opacity-100 motion-reduce:opacity-0"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 ring-0 ring-inset ring-white/0 transition-[box-shadow] duration-300 motion-safe:group-hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
                    />
                  </>
                ) : (
                  <div className="flex h-full min-h-[8rem] w-full items-center justify-center bg-gradient-to-br from-border-light/50 to-border-light/20 font-body text-sm text-text-muted">
                    Нет обложки
                  </div>
                )}
              </Link>
              <div className="p-5">
                <time className="font-body text-xs text-text-subtle" dateTime={post.date}>
                  {post.date}
                </time>
                <h3 className="mt-2 font-heading text-xl font-semibold text-text">
                  <Link to={`/blog/${post.slug}`} className="text-text hover:text-accent">
                    {post.title}
                  </Link>
                </h3>
                <div
                  className="cms-html mt-2 font-body text-sm leading-relaxed text-text-muted [&_p]:m-0 [&_table]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: post.excerpt }}
                />
                <Link
                  to={`/blog/${post.slug}`}
                  className="mt-4 inline-block font-body text-sm font-medium text-accent hover:underline"
                >
                  {readMore}
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
