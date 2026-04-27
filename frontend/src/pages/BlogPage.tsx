import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { fetchBlogPosts, type BlogListItem } from '../lib/api'
import { Helmet } from 'react-helmet-async'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import { publicSiteUrl } from '../config/publicSite'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { buildSeoTitle, truncateMetaDescription } from '../lib/seoVitrine'

export function BlogPage() {
  const site = publicSiteUrl()
  const { seoDefaults, siteName } = useSiteSettings()
  const blogTitle = buildSeoTitle('listing', { title: 'Блог', siteName }, seoDefaults)
  const blogDesc = truncateMetaDescription(
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
        <link rel="canonical" href={`${site}/blog`} />
        <meta name="twitter:card" content={tw} />
        {seoDefaults.ogImageUrl ? <meta name="twitter:image" content={seoDefaults.ogImageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${site}/blog`} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={blogTitle} />
        <meta property="og:description" content={blogDesc} />
        {seoDefaults.ogImageUrl ? <meta property="og:image" content={seoDefaults.ogImageUrl} /> : null}
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div className="fabric-page-main min-w-0 overflow-x-clip">
        <h1 className="fabric-section-title">Блог</h1>
        <p className="mt-4 max-w-xl font-body text-text-muted">Материалы для заказчиков и монтажников.</p>

        {loading ? (
          <p className="mt-10 font-body text-text-muted">Загрузка…</p>
        ) : (
          <ul className="mt-10 flex flex-col gap-6">
            {posts.map((post) => (
              <li
                key={post.slug}
                className="fabric-card flex flex-col gap-4 p-5 sm:flex-row"
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

        <Link to="/" className="fabric-strap-btn mt-12 inline-block rounded-full border border-border px-5 py-2 font-medium text-accent hover:border-accent/60">
          ← На главную
        </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
