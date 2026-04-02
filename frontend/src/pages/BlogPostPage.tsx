import { Link, useParams } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'

export function BlogPostPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[720px] px-4 py-16 md:px-6">
        <h1 className="font-heading text-3xl font-bold text-text md:text-4xl">
          Статья: {slug}
        </h1>
        <p className="mt-4 font-body text-text-muted">
          Здесь будет WYSIWYG-контент из API (этап блога).
        </p>
        <Link to="/blog" className="mt-8 inline-block font-medium text-accent hover:underline">
          ← К списку блога
        </Link>
      </main>
      <SiteFooter />
    </>
  )
}
