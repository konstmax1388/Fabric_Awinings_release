import { startTransition, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { fetchBlogPost, type BlogDetail } from '../lib/api'
import { Helmet } from 'react-helmet-async'
import { OptimizedImage } from '../components/ui/OptimizedImage'

export function BlogPostPage() {
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

  if (post === undefined) {
    return (
      <>
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
    return (
      <>
        <Helmet>
          <title>Статья не найдена — Фабрика Тентов</title>
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

  return (
    <>
      <Helmet>
        <title>{post.seo?.pageTitle ?? `${post.title} — блог`}</title>
        <meta name="description" content={post.seo?.metaDescription ?? post.excerpt} />
        {post.seo?.robots ? <meta name="robots" content={post.seo.robots} /> : null}
        {post.seo?.canonicalUrl ? <link rel="canonical" href={post.seo.canonicalUrl} /> : null}
        {post.seo?.ogImage || post.img ? (
          <meta property="og:image" content={post.seo?.ogImage || post.img} />
        ) : null}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.seo?.pageTitle ?? post.title} />
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <article className="fabric-page-main fabric-card min-w-0 max-w-[820px] p-5 md:p-8">
          <time className="font-body text-sm text-text-subtle">{post.date}</time>
          <h1 className="fabric-section-title mt-2 break-words md:text-4xl">{post.title}</h1>
          {post.img ? (
            <OptimizedImage
              src={post.img}
              alt=""
              priority
              widths={[640, 960, 1200]}
              sizes="(max-width: 768px) 100vw, 720px"
              className="mt-8 w-full rounded-2xl object-cover"
            />
          ) : null}
          <div
            className="cms-html mt-8 space-y-4 font-body text-base leading-relaxed text-text [&_p]:mt-4"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
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
