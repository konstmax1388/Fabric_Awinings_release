import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard } from '../catalog/ProductCard'
import type { Product } from '../../data/products'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { fetchFeaturedProducts } from '../../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'

export function FeaturedProductsSection() {
  const reduce = useReducedMotion()
  const { home } = useSiteSettings()
  const feat = home?.featured
  const loadingText = home?.ui?.loadingFeatured ?? 'Загрузка подборки…'
  const heading = feat?.heading ?? 'Подборка на главной'
  const subheading =
    feat?.subheading ?? 'Подборка популярных позиций. Полный ассортимент — в каталоге.'
  const catalogCta = feat?.catalogCta ?? 'Весь каталог'

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchFeaturedProducts().then((list) => {
      if (!cancelled) {
        setProducts(list)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className="mx-auto min-w-0 max-w-[1280px] px-4 py-12 md:px-6 md:py-24">
        <p className="font-body text-text-muted">{loadingText}</p>
      </section>
    )
  }

  if (products.length === 0) return null

  return (
    <section className="mx-auto min-w-0 max-w-[1280px] px-4 py-12 md:px-6 md:py-24">
      <motion.div
        initial={reduce ? false : fadeUpHidden}
        whileInView={reduce ? undefined : fadeUpVisible}
        viewport={{ once: true, amount: 0.1 }}
        transition={easeOutSoft}
      >
        <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">{heading}</h2>
        <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">{subheading}</p>
      </motion.div>

      <motion.div
        className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.06 }}
      >
        {products.map((p) => (
          <motion.div key={p.id} variants={staggerItem}>
            <ProductCard product={p} />
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-10 text-center">
        <Link
          to="/catalog"
          className="inline-flex h-12 min-h-[44px] items-center justify-center rounded-[40px] border-2 border-accent px-8 font-body font-medium text-accent hover:bg-[rgba(232,122,0,0.08)]"
        >
          {catalogCta}
        </Link>
      </div>
    </section>
  )
}
