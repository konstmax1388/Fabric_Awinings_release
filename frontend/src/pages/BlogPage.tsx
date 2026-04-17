import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { fetchBlogPosts, type BlogListItem } from '../lib/api'
import { Helmet } from 'react-helmet-async'
import { OptimizedImage } from '../components/ui/OptimizedImage'

export function BlogPage() {
  const [posts, setPosts] = useState<BlogListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchBlogPosts().then((list) => {
      if (!cancelled) {
        setPosts(list)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <Helmet>
        <title>Блог — Фабрика Тентов</title>
        <meta
          name="description"
          content="Статьи о материалах, замере и монтаже тентов и навесов."
        />
      </Helmet>
      <SiteHeader />
      <main className="mx-auto min-w-0 max-w-[1280px] overflow-x-clip px-4 py-16 md:px-6">
        <h1 className="font-heading text-4xl font-bold text-text md:text-5xl">Блог</h1>
        <p className="mt-4 max-w-xl font-body text-text-muted">Материалы для заказчиков и монтажников.</p>

        {loading ? (
          <p className="mt-10 font-body text-text-muted">Загрузка…</p>
        ) : (
          <ul className="mt-10 flex flex-col gap-8">
            {posts.map((post) => (
              <li
                key={post.slug}
                className="flex flex-col gap-4 border-b border-border-light pb-8 sm:flex-row"
              >
                {post.img ? (
                  <OptimizedImage
                    src={post.img}
                    alt=""
                    widths={[480, 640, 800]}
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="h-40 w-full shrink-0 rounded-2xl object-cover sm:h-32 sm:w-48"
                  />
                ) : null}
                <div>
                  <time className="font-body text-xs text-text-subtle">{post.date}</time>
                  <h2 className="mt-1 font-heading text-2xl font-semibold text-text">
                    <Link to={`/blog/${post.slug}`} className="hover:text-accent">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 font-body text-text-muted">{post.excerpt}</p>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="mt-3 inline-block font-medium text-accent hover:underline"
                  >
                    Читать →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Link to="/" className="mt-12 inline-block font-medium text-accent hover:underline">
          ← На главную
        </Link>
      </main>
      <SiteFooter />
    </>
  )
}
