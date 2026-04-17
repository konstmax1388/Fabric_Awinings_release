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
        <main className="mx-auto min-w-0 max-w-[720px] overflow-x-clip px-4 py-16 md:px-6">
          <p className="font-body text-text-muted">Загрузка…</p>
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
        <main className="mx-auto min-w-0 max-w-[720px] overflow-x-clip px-4 py-16 md:px-6">
          <h1 className="font-heading text-3xl font-bold text-text">Статья не найдена</h1>
          <Link to="/blog" className="mt-8 inline-block font-medium text-accent hover:underline">
            ← К списку блога
          </Link>
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
      <main className="mx-auto min-w-0 max-w-[720px] overflow-x-clip px-4 py-16 md:px-6">
        <article className="min-w-0">
          <time className="font-body text-sm text-text-subtle">{post.date}</time>
          <h1 className="mt-2 break-words font-heading text-3xl font-bold text-text md:text-4xl">{post.title}</h1>
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
        <Link to="/blog" className="mt-12 inline-block font-medium text-accent hover:underline">
          ← К списку блога
        </Link>
      </main>
      <SiteFooter />
    </>
  )
}
