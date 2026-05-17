import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { fetchBlogPosts, type BlogListItem } from '../lib/api'
import { Helmet } from 'react-helmet-async'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import { useCanonicalHrefForMeta } from '../context/CanonicalUrlContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { buildSeoTitle, truncateMetaDescription } from '../lib/seoVitrine'

export function BlogPage() {
  const { seoDefaults, siteName } = useSiteSettings()
  const canonicalForMeta = useCanonicalHrefForMeta()
  const blogTitle = buildSeoTitle('listing', { title: 'Блог', siteName }, seoDefaults)
  const blogDesc = truncateMetaDescription(
    seoDefaults.blogListingMetaDescription?.trim() ||
      seoDefaults.defaultMetaDescription?.trim() ||
      'Статьи о материалах, замере и монтаже тентов и навесов.',
    undefined,
    seoDefaults,
  )
  const tw = seoDefaults.twitterCard || 'summary_large_image'
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
        <title>{blogTitle}</title>
        <meta name="description" content={blogDesc} />
        {!seoDefaults.allowIndexing ? <meta name="robots" content="noindex, nofollow" /> : null}
        <meta name="twitter:card" content={tw} />
        {seoDefaults.ogImageUrl ? <meta name="twitter:image" content={seoDefaults.ogImageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalForMeta} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={blogTitle} />
        <meta property="og:description" content={blogDesc} />
        {seoDefaults.ogImageUrl ? <meta property="og:image" content={seoDefaults.ogImageUrl} /> : null}
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div className="fabric-page-main mx-auto min-w-0 max-w-4xl overflow-x-clip px-1 sm:px-0">
        <h1 className="fabric-section-title">Блог</h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-text-muted md:text-lg">
          Материалы для заказчиков и монтажников.
        </p>

        {loading ? (
          <p className="mt-10 font-body text-text-muted">Загрузка…</p>
        ) : (
          <ul className="mt-10 flex flex-col gap-8 md:gap-10">
            {posts.map((post) => (
              <li
                key={post.slug}
                className="fabric-card group flex flex-col overflow-hidden rounded-2xl border border-border-light/60 bg-surface p-0 shadow-sm transition-[box-shadow,transform] duration-300 hover:border-accent/20 hover:shadow-lg md:flex-row md:items-stretch"
              >
                {post.img ? (
                  <Link
                    to={`/blog/${post.slug}`}
                    className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-border-light/20 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent md:aspect-auto md:w-[min(100%,380px)] md:min-w-[300px] md:max-w-[44%]"
                  >
                    <OptimizedImage
                      src={post.img}
                      alt={post.title}
                      widths={[640, 800, 960, 1200, 1536]}
                      sizes="(max-width: 767px) 100vw, 380px"
                      className="h-full min-h-[12rem] w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03] md:min-h-[16rem]"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 motion-safe:group-hover:opacity-100 motion-reduce:opacity-0"
                    />
                  </Link>
                ) : (
                  <div className="flex min-h-[10rem] w-full shrink-0 items-center justify-center bg-gradient-to-br from-border-light/40 to-border-light/10 md:w-[min(100%,380px)] md:min-w-[300px] md:max-w-[44%] md:min-h-[16rem]">
                    <span className="font-body text-sm text-text-muted">Нет обложки</span>
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col justify-center p-6 md:p-8">
                  <time className="font-body text-xs uppercase tracking-wide text-text-subtle">{post.date}</time>
                  <h2 className="mt-2 font-heading text-2xl font-semibold leading-tight text-text md:text-3xl">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-text no-underline transition-colors hover:text-accent hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <div
                    className="cms-html mt-3 line-clamp-4 font-body text-sm leading-relaxed text-text-muted md:text-base [&_p]:m-0 [&_table]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: post.excerpt }}
                  />
                  <Link
                    to={`/blog/${post.slug}`}
                    className="mt-5 inline-flex items-center gap-1 self-start font-medium text-accent underline-offset-2 transition-colors hover:underline"
                  >
                    Читать статью
                    <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
                      →
                    </span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Link to="/" className="fabric-strap-btn mt-12 inline-block rounded-full border border-border px-5 py-2 font-medium text-accent hover:border-accent/60">
          ← На главную
        </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
