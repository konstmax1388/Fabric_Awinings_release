import { Helmet } from 'react-helmet-async'
import { startTransition, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { AboutPageLayout } from '../components/static/AboutPageLayout'
import { ReviewsSection } from '../components/home/ReviewsSection'
import { fetchStaticPageBySlug, type StaticPageDto } from '../lib/api'

export function StaticPageRoute() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [page, setPage] = useState<StaticPageDto | null | undefined>(undefined)

  useEffect(() => {
    if (!slug) {
      setPage(null)
      return
    }
    let cancelled = false
    startTransition(() => setPage(undefined))
    fetchStaticPageBySlug(slug).then((p) => {
      if (!cancelled) setPage(p)
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (page === undefined) {
    return (
      <>
        <SiteHeader />
        <main className="fabric-page">
          <div className="fabric-page-main min-h-[60vh] w-full max-w-[960px]">
            <p className="font-body text-text-muted">Загрузка…</p>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  if (!page) {
    return (
      <>
        <SiteHeader />
        <main className="fabric-page">
          <div className="fabric-page-main min-h-[60vh] w-full max-w-[960px]">
            <h1 className="font-heading text-3xl font-bold text-text">Страница не найдена</h1>
            <Link
              to="/"
              className="fabric-strap-btn mt-8 inline-flex h-11 items-center justify-center rounded-[40px] border border-border px-6 font-body text-sm font-medium text-text transition hover:border-accent hover:text-accent"
            >
              На главную
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  const title = page.pageTitle?.trim() || `${page.title} — Фабрика Тентов`
  const desc = page.metaDescription?.trim() || page.title
  const aboutV1 = page.aboutPayload?.version === 1
  const aboutHeading = page.pageTitle?.trim() || page.title
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div
          className={`fabric-page-main min-h-[60vh] w-full ${aboutV1 ? 'max-w-[min(100%,1200px)]' : 'max-w-[960px]'}`}
        >
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-sm text-text-muted">
            <Link to="/" className="hover:text-accent">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text">{page.title}</span>
          </nav>
          {aboutV1 && page.aboutPayload ? (
            <>
              <article className="mt-8 min-w-0">
                <AboutPageLayout payload={page.aboutPayload} pageTitle={aboutHeading} />
              </article>
              <ReviewsSection mode="teaser" showListHeading />
            </>
          ) : (
            <article className="fabric-card mt-8 space-y-6 p-6 font-body text-sm leading-relaxed text-text md:p-8 md:text-base">
              <header className="space-y-2">
                <h1 className="font-heading text-2xl font-semibold text-text md:text-3xl">{page.title}</h1>
              </header>
              <div
                className="cms-html space-y-4 font-body text-base leading-relaxed text-text [&_p]:mt-4"
                dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
              />
            </article>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
