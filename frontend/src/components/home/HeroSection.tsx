import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PulsingCTA } from '../motion/PulsingCTA'
import { easeOutSoft, fadeUpHidden, fadeUpVisible } from '../../lib/motion-presets'

const heroBg =
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80'

export function HeroSection() {
  const reduce = useReducedMotion()
  const from = reduce ? fadeUpVisible : fadeUpHidden
  const to = fadeUpVisible

  return (
    <section className="relative overflow-hidden rounded-[24px] md:mx-6 lg:mx-auto lg:max-w-[1280px]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/85 via-[#1a1a1a]/55 to-transparent" />
      <div className="relative px-4 py-16 md:px-10 md:py-24 lg:py-28">
        <div className="max-w-2xl">
          <motion.h1
            className="font-heading text-4xl font-black tracking-tight text-surface md:text-5xl lg:text-7xl"
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.08 }}
          >
            Тенты на заказ
          </motion.h1>
          <motion.p
            className="mt-4 font-body text-lg text-surface/90 md:text-xl"
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.18 }}
          >
            Любая форма и размер: от навесов для техники до тентов для мероприятий. Своё производство —
            сроки и цена под контролем.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap gap-4"
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.28 }}
          >
            <PulsingCTA>
              <motion.span
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="inline-flex shadow-[0_4px_8px_0_rgba(232,122,0,0.35)]"
                style={{ borderRadius: 40 }}
              >
                <Link
                  to="/#calculator"
                  className="inline-flex h-14 min-h-[44px] items-center justify-center rounded-[40px] bg-accent px-8 font-body text-base font-medium text-surface hover:bg-[#c65f00]"
                  style={{ letterSpacing: '0.02em' }}
                >
                  Рассчитать стоимость
                </Link>
              </motion.span>
            </PulsingCTA>
            <motion.span
              whileHover={reduce ? undefined : { scale: 1.02 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              className="inline-flex rounded-[40px]"
            >
              <Link
                to="/catalog"
                className="inline-flex h-14 min-h-[44px] items-center justify-center rounded-[40px] border-2 border-surface/80 bg-transparent px-8 font-body text-base font-medium text-surface hover:bg-surface/10"
                style={{ letterSpacing: '0.02em' }}
              >
                Смотреть каталог
              </Link>
            </motion.span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
