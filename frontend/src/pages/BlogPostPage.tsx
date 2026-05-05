import { startTransition, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { fetchBlogPost, type BlogDetail } from '../lib/api'
import { Helmet } from 'react-helmet-async'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import { publicSiteUrl } from '../config/publicSite'
import { useSetCanonical, useCanonicalHrefForMeta } from '../context/CanonicalUrlContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { articleCoverAlt } from '../lib/imageAlt'
import { absolutizeCustomCanonical } from '../lib/canonicalPublicUrl'
import { buildSeoTitle, resolveMetaDescription } from '../lib/seoVitrine'

export function BlogPostPage() {
  const site = publicSiteUrl()
  const { seoDefaults, siteName } = useSiteSettings()
  const { slug = '' } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogDetail | null | undefined>(undefined)

  useEffect(() => {
    if (!slug) {
      startTransition(() => setPost(null))
      return
    }
    let cancelled = false
    startTransition(() => setPost(undefined))
    fetchBlogPost(slug).then((p) => {
      if (!cancelled) setPost(p)
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  const canonicalOverride = useMemo(() => {
    if (post === undefined || post === null) return null
    const fallback = `${site}/blog/${encodeURIComponent(slug)}`
    return absolutizeCustomCanonical(site, post.seo?.canonicalUrl, fallback)
  }, [post, site, slug])
  useSetCanonical(canonicalOverride)
  const canonicalForMeta = useCanonicalHrefForMeta()

  if (post === undefined) {
    const loadingDesc = resolveMetaDescription(undefined, seoDefaults, 'Загрузка статьи блога.')
    return (
      <>
        <Helmet>
          <meta name="description" content={loadingDesc} />
        </Helmet>
        <SiteHeader />
        <main className="fabric-page">
          <div className="fabric-page-main min-w-0 max-w-[720px] overflow-x-clip">
          <p className="font-body text-text-muted">Загрузка…</p>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  if (!post) {
    const missingDesc = resolveMetaDescription(
      undefined,
      seoDefaults,
      'Статья блога не найдена. Другие материалы — в разделе «Блог».',
    )
    return (
      <>
        <Helmet>
          <title>Статья не найдена — Фабрика Тентов</title>
          <meta name="description" content={missingDesc} />
        </Helmet>
        <SiteHeader />
        <main className="fabric-page">
          <div className="fabric-page-main min-w-0 max-w-[720px] overflow-x-clip">
          <h1 className="font-heading text-3xl font-bold text-text">Статья не найдена</h1>
          <Link to="/blog" className="fabric-strap-btn mt-8 inline-block rounded-full border border-border px-5 py-2 font-medium text-accent hover:border-accent/60">
            ← К списку блога
          </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  const docTitle =
    post.seo?.pageTitle?.trim() ||
    buildSeoTitle('article', { title: post.title, siteName }, seoDefaults)
  const metaDesc = resolveMetaDescription(post.seo?.metaDescription ?? post.excerpt ?? '', seoDefaults, post.title)
  const ogImage = post.seo?.ogImage || post.img || seoDefaults.ogImageUrl || ''
  const ogTitle = post.seo?.pageTitle?.trim() || post.title
  const tw = seoDefaults.twitterCard || 'summary_large_image'

  return (
    <>
      <Helmet>
        <title>{docTitle}</title>
        <meta name="description" content={metaDesc} />
        {post.seo?.robots ? <meta name="robots" content={post.seo.robots} /> : null}
        {ogImage ? <meta property="og:image" content={ogImage} /> : null}
        <meta name="twitter:card" content={tw} />
        {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalForMeta} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:locale" content={seoDefaults.locale.replace('_', '-')} />
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <article className="fabric-page-main fabric-card min-w-0 max-w-[820px] p-5 md:p-8">
          <time className="font-body text-sm text-text-subtle">{post.date}</time>
          <h1 className="fabric-section-title mt-2 break-words md:text-4xl">{post.title}</h1>
          <div className="mt-6 flow-root md:mt-8">
            {post.img ? (
              <figure className="mb-6 sm:float-left sm:mb-4 sm:mr-6 sm:mt-1 sm:w-[min(42%,18rem)] md:mr-8 md:w-[min(40%,20rem)]">
                <OptimizedImage
                  src={post.img}
                  alt={articleCoverAlt(post.title)}
                  priority
                  widths={[480, 640, 960]}
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="w-full rounded-2xl object-cover"
                />
              </figure>
            ) : null}
            <div
              className="cms-html space-y-4 font-body text-base leading-relaxed text-text [&_p]:mt-4 sm:[&_p:first-child]:mt-0"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          </div>
        </article>
        <div className="fabric-page-main max-w-[820px] pt-0">
        <Link to="/blog" className="fabric-strap-btn mt-6 inline-block rounded-full border border-border px-5 py-2 font-medium text-accent hover:border-accent/60">
          ← К списку блога
        </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
