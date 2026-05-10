import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  type CSSProperties,
  type SyntheticEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import type { HeroAction, HeroCallbackModalTexts, HeroSlide } from '../../types/homePage'
import { storefrontMediaUrl } from '../../lib/api'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { MagneticHover } from '../motion/MagneticHover'
import { PulsingCTA } from '../motion/PulsingCTA'
import { imageVariantUrl } from '../../lib/optimizedImage'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, subtleButtonHover, cardHoverTransition } from '../../lib/motion-presets'
import { HeroCallbackModal } from './HeroCallbackModal'
import { OptimizedImage } from '../ui/OptimizedImage'
import { TextWithBr } from '../ui/TextWithBr'

function isExternalHref(href: string) {
  return (
    /^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
  )
}

function HeroCtaLink({
  href,
  className,
  style,
  children,
}: {
  href: string
  className: string
  style?: CSSProperties
  children: React.ReactNode
}) {
  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} style={style} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link to={href} className={className} style={style}>
      {children}
    </Link>
  )
}

function resolveLinkHref(
  action: HeroAction | undefined,
  calculatorEnabled: boolean,
  role: 'primary' | 'secondary',
): string {
  if (action?.type === 'callback') return ''
  const h = action?.href?.trim() || ''
  if (h) return h
  if (role === 'primary') return calculatorEnabled ? '/#calculator' : '/catalog'
  return '/catalog'
}

const primaryBtnClass =
  'fabric-strap-btn inline-flex h-14 min-h-[44px] max-w-full items-center justify-center rounded-[40px] bg-accent px-5 font-body text-base font-medium sm:px-8'
const secondaryBtnClass =
  'fabric-strap-btn inline-flex h-14 min-h-[44px] max-w-full items-center justify-center rounded-[40px] border-2 bg-transparent px-5 font-body text-base font-medium sm:px-8'
const HERO_VIDEO_START_TIMEOUT_MS = 5000

/** Ширины под /api/image-variant/ (hero на всю ширину экрана, без загрузки многомегабайтных оригиналов). */
const HERO_BACKGROUND_WIDTHS = [480, 640, 800, 960, 1200, 1600] as const

function slideOn(slide: HeroSlide | null | undefined, k: keyof HeroSlide): boolean {
  if (!slide) return true
  const v = slide[k as keyof typeof slide]
  if (v === false) return false
  return true
}

export function HeroSection() {
  const reduce = useReducedMotion()
  const { home, calculatorEnabled } = useSiteSettings()
  const hero = home?.hero
  const from = reduce ? fadeUpVisible : fadeUpHidden
  const to = fadeUpVisible

  const [callbackOpen, setCallbackOpen] = useState(false)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [failedVideoBySlide, setFailedVideoBySlide] = useState<Record<number, boolean>>({})
  const [startedVideoBySlide, setStartedVideoBySlide] = useState<Record<number, boolean>>({})
  const slideT0Ref = useRef(0)
  const videoDeskRef = useRef<HTMLVideoElement | null>(null)
  const videoMobRef = useRef<HTMLVideoElement | null>(null)
  const videoUnifiedRef = useRef<HTMLVideoElement | null>(null)
  const [heroVideoNode, setHeroVideoNode] = useState<HTMLVideoElement | null>(null)
  const [barProgress, setBarProgress] = useState(0)
  const [coarsePointer, setCoarsePointer] = useState(false)
  const slideCountRef = useRef(0)
  const prevCallbackOpenRef = useRef(false)

  const isHeroV2 = Boolean(hero && (hero as { schemaVersion?: number }).schemaVersion === 2)

  const autoplayIntervalMs = useMemo(() => {
    if (!isHeroV2 || !hero) return 7000
    const raw = (hero as { autoplayIntervalMs?: unknown }).autoplayIntervalMs
    const v = typeof raw === 'string' ? Number(raw) : raw
    if (typeof v !== 'number' || !Number.isFinite(v)) return 7000
    return Math.max(3000, Math.min(120_000, v))
  }, [isHeroV2, hero])

  const showCarouselArrows =
    (hero as { showCarouselArrows?: boolean } | undefined)?.showCarouselArrows !== false
  const showCarouselProgress =
    (hero as { showCarouselProgress?: boolean } | undefined)?.showCarouselProgress !== false

  const v2EnabledSlides = useMemo((): HeroSlide[] | null => {
    if (!isHeroV2 || !Array.isArray(hero?.slides)) return null
    return hero.slides.filter((s): s is HeroSlide => {
      if (!s || typeof s !== 'object') return false
      return s.enabled !== false
    })
  }, [isHeroV2, hero?.slides])

  /** Без картинки и без видео слайд на витрине не показываем (точки и прогресс только по таким). */
  const v2VisibleSlides = useMemo((): HeroSlide[] | null => {
    if (!v2EnabledSlides) return null
    return v2EnabledSlides.filter((s) => {
      const imageUrl = typeof s.imageUrl === 'string' ? s.imageUrl.trim() : ''
      const videoUrl = typeof s.videoUrl === 'string' ? s.videoUrl.trim() : ''
      const mobileImageUrl = typeof s.mobileImageUrl === 'string' ? s.mobileImageUrl.trim() : ''
      const mobileVideoUrl = typeof s.mobileVideoUrl === 'string' ? s.mobileVideoUrl.trim() : ''
      return Boolean(imageUrl || videoUrl || mobileImageUrl || mobileVideoUrl)
    })
  }, [v2EnabledSlides])

  const dataSrc: HeroSlide | (typeof hero) | null = !isHeroV2
    ? hero
    : v2VisibleSlides && v2VisibleSlides.length > 0
      ? v2VisibleSlides[currentSlide % v2VisibleSlides.length]
      : v2EnabledSlides && v2EnabledSlides.length > 0
        ? v2EnabledSlides[currentSlide % v2EnabledSlides.length]
        : null

  const title = isHeroV2
    ? String((dataSrc as HeroSlide | null)?.title ?? '')
    : String(hero?.title ?? '')
  const subtitle = isHeroV2
    ? String((dataSrc as HeroSlide | null)?.subtitle ?? '')
    : String(hero?.subtitle ?? '')
  const eyebrow = isHeroV2
    ? String((dataSrc as HeroSlide | null)?.eyebrow ?? '').trim()
    : (hero?.eyebrow?.trim() || '')
  const usp = isHeroV2
    ? String((dataSrc as HeroSlide | null)?.usp ?? '').trim()
    : String(hero?.usp ?? '')
        .trim() || ''
  const trustLine = isHeroV2
    ? String((dataSrc as HeroSlide | null)?.trustLine ?? '').trim()
    : String(hero?.trustLine ?? '')
        .trim() || ''
  const trustItems: string[] = (() => {
    if (isHeroV2 && dataSrc) {
      const t = (dataSrc as HeroSlide).trustItems
      return Array.isArray(t)
        ? t.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
        : []
    }
    if (Array.isArray(hero?.trustItems)) {
      return hero.trustItems.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
    }
    return []
  })()
  const showTrustI = (i: 0 | 1 | 2) =>
    !isHeroV2
      ? true
      : slideOn(dataSrc as HeroSlide, i === 0 ? 'showTrustI0' : i === 1 ? 'showTrustI1' : 'showTrustI2')

  const showTrustBlockLine = !isHeroV2 || slideOn(dataSrc as HeroSlide, 'showTrustLine')
  const showEyebrowBlock = !isHeroV2 || slideOn(dataSrc as HeroSlide, 'showEyebrow')

  const heroStats = (() => {
    if (isHeroV2 && dataSrc) {
      const st = (dataSrc as HeroSlide).stats
      const s0 = (dataSrc as HeroSlide).showStat0
      const s1 = (dataSrc as HeroSlide).showStat1
      const s2 = (dataSrc as HeroSlide).showStat2
      if (!Array.isArray(st)) return []
      const out: { value: string; label: string }[] = []
      ;[0, 1, 2].forEach((i) => {
        const on = i === 0 ? s0 !== false : i === 1 ? s1 !== false : s2 !== false
        if (!on) return
        const item = st[i] as { value?: string; label?: string } | undefined
        if (!item) return
        const value = String(item.value || '').trim()
        const label = String(item.label || '').trim()
        if (value && label) out.push({ value, label })
      })
      return out
    }
    if (Array.isArray(hero?.stats)) {
      return hero.stats
        .map((item) => ({
          value: String(item?.value || '').trim(),
          label: String(item?.label || '').trim(),
        }))
        .filter((item) => item.value && item.label)
        .slice(0, 3)
    }
    return []
  })()
  const ctaPrimary = isHeroV2
    ? String((dataSrc as HeroSlide | null)?.ctaPrimary ?? '')
    : String(hero?.ctaPrimary ?? '')
  const ctaSecondary = isHeroV2
    ? String((dataSrc as HeroSlide | null)?.ctaSecondary ?? '')
    : String(hero?.ctaSecondary ?? '')
  const heroBg = hero?.bgImageUrl?.trim() || ''
  const heroTextToneN = (() => {
    const t = isHeroV2 ? (dataSrc as HeroSlide | null)?.textTone : hero?.textTone
    return t === 'dark' ? 'dark' : 'light'
  })()
  const heroHeightMode = isHeroV2
    ? (dataSrc as HeroSlide | null)?.heightMode === 'wow'
      ? 'wow'
      : (dataSrc as HeroSlide | null)?.heightMode === 'normal'
        ? 'normal'
        : 'tall'
    : hero?.heightMode === 'wow'
      ? 'wow'
      : hero?.heightMode === 'normal'
        ? 'normal'
        : 'tall'
  const heroOverlayStrength01 = useMemo((): number => {
    if (isHeroV2 && dataSrc) {
      const o = (dataSrc as HeroSlide).overlayStrength
      if (o === 0) return 0
      if (typeof o === 'string') {
        const n = Number(o)
        if (Number.isFinite(n)) return Math.max(0, Math.min(1, n / 100))
      }
      if (typeof o === 'number' && Number.isFinite(o)) {
        return Math.max(0, Math.min(1, o / 100))
      }
    }
    return 0.85
  }, [isHeroV2, dataSrc])

  const slides = useMemo(() => {
    const raw = Array.isArray(hero?.slides) ? hero.slides : []
    type Bundle = {
      imageUrl: string
      videoUrl: string
      mobileImageUrl: string
      mobileVideoUrl: string
      textTone: 'light' | 'dark'
    }
    const normUrl = (u: string) => (u ? storefrontMediaUrl(u) : '')
    if (isHeroV2) {
      if (v2VisibleSlides && v2VisibleSlides.length) {
        return v2VisibleSlides.map((s) => {
          const imageUrl = normUrl(typeof s.imageUrl === 'string' ? s.imageUrl.trim() : '')
          const videoUrl = normUrl(typeof s.videoUrl === 'string' ? s.videoUrl.trim() : '')
          const mobileImageUrl = normUrl(
            typeof s.mobileImageUrl === 'string' ? s.mobileImageUrl.trim() : '',
          )
          const mobileVideoUrl = normUrl(
            typeof s.mobileVideoUrl === 'string' ? s.mobileVideoUrl.trim() : '',
          )
          const textTone = s.textTone === 'dark' ? 'dark' : 'light'
          return { imageUrl, videoUrl, mobileImageUrl, mobileVideoUrl, textTone }
        })
      }
      /** Слайды с медиа отфильтрованы, но есть общий фон (legacy или после смены полей) — не оставляем hero пустым. */
      const hbRaw = heroBg.trim()
      const hb = hbRaw ? normUrl(hbRaw) : ''
      if (hb && v2EnabledSlides && v2EnabledSlides.length) {
        return v2EnabledSlides.map((s) => {
          const textTone = s.textTone === 'dark' ? 'dark' : 'light'
          return {
            imageUrl: hb,
            videoUrl: '',
            mobileImageUrl: hb,
            mobileVideoUrl: '',
            textTone,
          }
        })
      }
      if (hb) {
        const heroTone = hero?.textTone === 'dark' ? 'dark' : 'light'
        return [
          {
            imageUrl: hb,
            videoUrl: '',
            mobileImageUrl: hb,
            mobileVideoUrl: '',
            textTone: heroTone,
          },
        ]
      }
      return [] as Bundle[]
    }
    const heroTone = hero?.textTone === 'dark' ? 'dark' : 'light'
    const normalized = raw
      .map((s) => {
        if (!s || typeof s !== 'object') return null
        const slide = s as HeroSlide
        const imageUrl = normUrl(typeof slide.imageUrl === 'string' ? slide.imageUrl.trim() : '')
        const videoUrl = normUrl(typeof slide.videoUrl === 'string' ? slide.videoUrl.trim() : '')
        const mobileImageUrl = normUrl(
          typeof slide.mobileImageUrl === 'string' ? slide.mobileImageUrl.trim() : '',
        )
        const mobileVideoUrl = normUrl(
          typeof slide.mobileVideoUrl === 'string' ? slide.mobileVideoUrl.trim() : '',
        )
        const textTone = slide.textTone === 'dark' ? 'dark' : heroTone
        if (!imageUrl && !videoUrl && !mobileImageUrl && !mobileVideoUrl) return null
        return { imageUrl, videoUrl, mobileImageUrl, mobileVideoUrl, textTone }
      })
      .filter((s): s is Bundle => s !== null)
    if (normalized.length) return normalized
    return heroBg
      ? [
          {
            imageUrl: normUrl(heroBg.trim()),
            videoUrl: '',
            mobileImageUrl: '',
            mobileVideoUrl: '',
            textTone: heroTone as 'light' | 'dark',
          },
        ]
      : []
  }, [hero?.slides, heroBg, hero?.textTone, isHeroV2, v2VisibleSlides, v2EnabledSlides])

  /** До lg (1024px): mobile-first раскладка и «мобильные» медиа; с lg — десктопный hero. */
  const isNarrow = useMediaQuery('(max-width: 1023px)')

  const hasSlides = slides.length > 0
  const activeSlide = hasSlides ? slides[currentSlide % slides.length] : null
  const imgDesk = activeSlide
    ? String(activeSlide.imageUrl || activeSlide.mobileImageUrl || '').trim()
    : ''
  const imgMob = activeSlide
    ? String(activeSlide.mobileImageUrl || activeSlide.imageUrl || '').trim()
    : ''
  const vidDesk = activeSlide
    ? String(activeSlide.videoUrl || activeSlide.mobileVideoUrl || '').trim()
    : ''
  const vidMob = activeSlide
    ? String(activeSlide.mobileVideoUrl || activeSlide.videoUrl || '').trim()
    : ''
  const sameVideoUrl = Boolean(vidDesk && vidMob && vidDesk === vidMob)
  const hasAnyBgMedia = Boolean(imgDesk || imgMob || vidDesk || vidMob)
  const splitHeroImage = Boolean(imgDesk && imgMob && imgDesk !== imgMob)

  const posterDesk = useMemo(() => {
    const base = imgDesk || imgMob
    if (!base) return undefined
    return imageVariantUrl(base, { w: 1600, format: 'webp' }) ?? base
  }, [imgDesk, imgMob])
  const posterMob = useMemo(() => {
    const base = imgMob || imgDesk
    if (!base) return undefined
    return imageVariantUrl(base, { w: 1600, format: 'webp' }) ?? base
  }, [imgDesk, imgMob])

  const activeSlideTextTone = activeSlide?.textTone ?? heroTextToneN
  const videoFailed = Boolean(failedVideoBySlide[currentSlide])
  const showDeskVideo = Boolean(vidDesk) && !videoFailed
  const showMobVideo = Boolean(vidMob) && !videoFailed
  const shouldShowVideo = isNarrow ? showMobVideo : showDeskVideo
  const hasStartedActiveVideo = Boolean(startedVideoBySlide[currentSlide])
  const deskVideoRevealOpacity =
    !showDeskVideo ? 0 : reduce ? 1 : !imgDesk ? 1 : hasStartedActiveVideo ? 1 : 0
  const mobVideoRevealOpacity =
    !showMobVideo ? 0 : reduce ? 1 : !imgMob ? 1 : hasStartedActiveVideo ? 1 : 0

  const primaryAction = isHeroV2
    ? (dataSrc as HeroSlide | null)?.primaryAction
    : hero?.primaryAction
  const secondaryAction = isHeroV2
    ? (dataSrc as HeroSlide | null)?.secondaryAction
    : hero?.secondaryAction
  const callbackModal: HeroCallbackModalTexts = isHeroV2
    ? (dataSrc as HeroSlide | null)?.callbackModal ?? {}
    : hero?.callbackModal ?? {}
  const primaryIsCallback = primaryAction?.type === 'callback'
  const secondaryIsCallback = secondaryAction?.type === 'callback'
  const primaryHref = resolveLinkHref(primaryAction, calculatorEnabled, 'primary')
  const secondaryHref = resolveLinkHref(secondaryAction, calculatorEnabled, 'secondary')

  const openCallback = () => setCallbackOpen(true)

  const hasVisibleTrustPills = trustItems.some(
    (item, idx) => Boolean(item) && showTrustI(idx as 0 | 1 | 2),
  )
  const hasTrustBlock =
    (showTrustBlockLine && Boolean(trustLine)) || (trustItems.length > 0 && hasVisibleTrustPills)

  slideCountRef.current = slides.length

  /** Видео: смена слайда по onEnded, не по таймеру. Картинка / без ролика — по autoplayIntervalMs. */
  const advanceByTimer = !shouldShowVideo

  useEffect(() => {
    if (slides.length <= 1 || callbackOpen || !advanceByTimer) return
    const id = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      setCurrentSlide((prev) => {
        const n = slideCountRef.current
        if (n < 2) return prev
        return (prev + 1) % n
      })
    }, autoplayIntervalMs)
    return () => window.clearInterval(id)
  }, [slides.length, autoplayIntervalMs, callbackOpen, advanceByTimer])

  useEffect(() => {
    if (slides.length <= 1) {
      setCurrentSlide(0)
      return
    }
    setCurrentSlide((prev) => (prev >= slides.length ? 0 : prev))
  }, [slides.length])

  useEffect(() => {
    slideT0Ref.current = Date.now()
    setBarProgress(0)
  }, [currentSlide, slides.length])

  useEffect(() => {
    if (slides.length <= 1 || !showCarouselProgress) {
      setBarProgress(0)
      return
    }
    if (callbackOpen) return
    if (shouldShowVideo) {
      const v = heroVideoNode
      if (!v) {
        return
      }
      const sync = () => {
        if (document.hidden) return
        const d = v.duration
        if (typeof d === 'number' && d > 0 && Number.isFinite(d)) {
          setBarProgress(Math.min(1, v.currentTime / d))
        }
      }
      v.addEventListener('timeupdate', sync)
      v.addEventListener('loadedmetadata', sync)
      v.addEventListener('progress', sync)
      sync()
      return () => {
        v.removeEventListener('timeupdate', sync)
        v.removeEventListener('loadedmetadata', sync)
        v.removeEventListener('progress', sync)
      }
    }
    const id = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      setBarProgress(
        Math.min(1, (Date.now() - slideT0Ref.current) / Math.max(1, autoplayIntervalMs)),
      )
    }, 40)
    return () => window.clearInterval(id)
  }, [
    slides.length,
    showCarouselProgress,
    currentSlide,
    autoplayIntervalMs,
    callbackOpen,
    shouldShowVideo,
    heroVideoNode,
  ])

  useEffect(() => {
    if (prevCallbackOpenRef.current && !callbackOpen) {
      slideT0Ref.current = Date.now()
      setBarProgress(0)
    }
    prevCallbackOpenRef.current = callbackOpen
  }, [callbackOpen])

  useEffect(() => {
    if (!shouldShowVideo || hasStartedActiveVideo) return
    const slideAtStart = currentSlide
    const timerId = window.setTimeout(() => {
      setFailedVideoBySlide((prev) => ({
        ...prev,
        [slideAtStart]: true,
      }))
    }, HERO_VIDEO_START_TIMEOUT_MS)
    return () => window.clearTimeout(timerId)
  }, [currentSlide, hasStartedActiveVideo, shouldShowVideo])

  useLayoutEffect(() => {
    if (sameVideoUrl && vidDesk) {
      setHeroVideoNode(videoUnifiedRef.current)
      return
    }
    setHeroVideoNode(isNarrow ? videoMobRef.current : videoDeskRef.current)
  }, [
    isNarrow,
    currentSlide,
    sameVideoUrl,
    vidDesk,
    vidMob,
    showDeskVideo,
    showMobVideo,
  ])

  useEffect(() => {
    if (sameVideoUrl && vidDesk) return
    const d = videoDeskRef.current
    const m = videoMobRef.current
    if (isNarrow) {
      d?.pause()
      void m?.play().catch(() => {})
    } else {
      m?.pause()
      void d?.play().catch(() => {})
    }
  }, [isNarrow, sameVideoUrl, vidDesk, currentSlide])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(pointer: coarse)')
    const sync = () => {
      setCoarsePointer(mq.matches)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (reduce) return
    const onScroll = () => setScrollY(window.scrollY)
    const onMove = (e: MouseEvent) => {
      const x = e.clientX / Math.max(1, window.innerWidth) - 0.5
      const y = e.clientY / Math.max(1, window.innerHeight) - 0.5
      setMouse({ x, y })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMove)
    }
  }, [reduce])

  const depth = useMemo(() => {
    if (reduce) return { bgX: 0, bgY: 0, textX: 0, textY: 0, gradX: 0, gradY: 0 }
    const scrollShift = Math.min(30, scrollY * 0.05)
    return {
      bgX: mouse.x * 22,
      bgY: mouse.y * 16 + scrollShift,
      textX: -mouse.x * 12,
      textY: -mouse.y * 7 - scrollShift * 0.26,
      gradX: mouse.x * 16,
      gradY: mouse.y * 12 + scrollShift * 0.62,
    }
  }, [mouse.x, mouse.y, reduce, scrollY])

  const gradParallax = useMemo(
    () =>
      reduce || coarsePointer || isNarrow
        ? { x: 0, y: 0 }
        : { x: depth.gradX, y: depth.gradY },
    [reduce, coarsePointer, isNarrow, depth.gradX, depth.gradY],
  )

  const textClasses =
    activeSlideTextTone === 'dark'
      ? {
          heading: 'text-[#111827]',
          body: 'text-[#1f2937]/90',
          subtle: 'text-[#1f2937]/85',
          uspLine: 'font-body font-bold text-amber-800',
          chip: 'text-[#111827]/90',
          chipLabel: 'text-[#111827]/75',
          chipBg: 'bg-white/65 border-black/10',
          trustPill: 'text-[#111827]/90 border-black/15 bg-white/55',
          slideDotOff: 'bg-[#1f2937]/45 hover:bg-[#1f2937]/70',
          primaryBtn: 'text-[#111827] hover:bg-[#c65f00]',
          secondaryBtn:
            'border-[#111827]/70 text-[#111827] hover:bg-[#111827]/12',
        }
      : {
          heading: 'text-white',
          body: 'text-white/90',
          subtle: 'text-white/85',
          uspLine:
            'font-body font-bold text-[#FFC107] [text-shadow:0_1px_3px_rgba(0,0,0,0.7),0_0_1px_rgba(0,0,0,0.9)]',
          chip: 'text-white',
          chipLabel: 'text-white/75',
          chipBg: 'bg-white/8 border-white/18',
          trustPill: 'text-white/90 border-white/28 bg-white/10',
          slideDotOff: 'bg-white/55 hover:bg-white/80',
          primaryBtn: 'text-white hover:bg-[#c65f00]',
          secondaryBtn:
            'border-white/80 text-white hover:bg-white/12',
        }

  const heroHeightClass =
    heroHeightMode === 'wow'
      ? 'min-h-[32rem] lg:min-h-[46rem]'
      : heroHeightMode === 'normal'
        ? 'min-h-[24rem] lg:min-h-[34rem]'
        : 'min-h-[28rem] lg:min-h-[40rem]'

  const carouselArrows =
    slides.length > 1 && showCarouselArrows
      ? {
          prev: () => {
            if (callbackOpen) return
            setCurrentSlide((i) => (i - 1 + slides.length) % slides.length)
          },
          next: () => {
            if (callbackOpen) return
            setCurrentSlide((i) => (i + 1) % slides.length)
          },
        }
      : null

  const carouselArrowBtnClass =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/[0.07] text-white/88 shadow-sm transition enabled:hover:border-accent/45 enabled:hover:bg-white/12 enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9'

  const mediaCrossfadeD = reduce ? 0.14 : 0.55
  const textSlideD = reduce ? 0.12 : 0.45
  const parallaxTransition = { type: 'spring' as const, stiffness: 62, damping: 16, mass: 1.2 }

  const scrimA = heroOverlayStrength01
  const showScrim = scrimA > 0.001

  const unifiedVideoRevealOpacity =
    !showDeskVideo
      ? 0
      : reduce
        ? 1
        : !imgDesk && !imgMob
          ? 1
          : hasStartedActiveVideo
            ? 1
            : 0

  const onHeroVideoEnded = (e: SyntheticEvent<HTMLVideoElement>) => {
    if (callbackOpen) return
    const n = slideCountRef.current
    if (n < 2) {
      const v = e.currentTarget
      v.currentTime = 0
      void v.play()
      return
    }
    setCurrentSlide((prev) => (prev + 1) % n)
  }

  return (
    <section
      className={`fabric-container relative min-w-0 overflow-hidden rounded-[24px] max-lg:flex max-lg:min-h-0 max-lg:flex-col ${heroHeightClass}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <HeroCallbackModal
        open={callbackOpen}
        onClose={() => setCallbackOpen(false)}
        modal={callbackModal}
      />
      <div
        className="absolute inset-x-0 bottom-0 top-[-1px] z-0 overflow-hidden rounded-[24px] isolate"
        aria-hidden
      >
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            {hasAnyBgMedia ? (
              <motion.div
                key={`hero-slide-bg-${currentSlide}`}
                className="absolute inset-0 overflow-hidden"
                initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 1.03 }}
                animate={{
                  opacity: 1,
                  x: isNarrow ? 0 : depth.bgX,
                  y: isNarrow ? 0 : depth.bgY,
                  scale: isNarrow ? 1 : 1.04,
                }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                transition={
                  reduce
                    ? { duration: mediaCrossfadeD }
                    : {
                        opacity: { duration: mediaCrossfadeD, ease: [0.2, 1, 0.32, 1] },
                        x: parallaxTransition,
                        y: parallaxTransition,
                        scale: parallaxTransition,
                      }
                }
                aria-hidden
              >
                <div className="absolute inset-0 overflow-hidden">
                  {imgDesk || imgMob ? (
                    splitHeroImage ? (
                      <>
                        {imgDesk ? (
                          <OptimizedImage
                            src={imgDesk}
                            alt=""
                            className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full object-cover object-center select-none lg:block"
                            widths={HERO_BACKGROUND_WIDTHS}
                            sizes="100vw"
                            priority
                          />
                        ) : null}
                        {imgMob ? (
                          <OptimizedImage
                            src={imgMob}
                            alt=""
                            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center select-none lg:hidden"
                            widths={HERO_BACKGROUND_WIDTHS}
                            sizes="100vw"
                            priority
                          />
                        ) : null}
                      </>
                    ) : (
                      <OptimizedImage
                        src={imgDesk || imgMob}
                        alt=""
                        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center select-none"
                        widths={HERO_BACKGROUND_WIDTHS}
                        sizes="100vw"
                        priority
                      />
                    )
                  ) : null}
                  {sameVideoUrl && vidDesk && showDeskVideo ? (
                    <motion.video
                      key={`hero-vu-${currentSlide}-${vidDesk}`}
                      ref={(el) => {
                        videoUnifiedRef.current = el
                      }}
                      className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover object-center"
                      src={vidDesk}
                      autoPlay
                      muted
                      loop={false}
                      playsInline
                      preload="metadata"
                      poster={posterDesk ?? posterMob}
                      onEnded={onHeroVideoEnded}
                      onError={() =>
                        setFailedVideoBySlide((prev) => ({
                          ...prev,
                          [currentSlide]: true,
                        }))
                      }
                      onPlaying={() =>
                        setStartedVideoBySlide((prev) => ({
                          ...prev,
                          [currentSlide]: true,
                        }))
                      }
                      onStalled={() =>
                        setFailedVideoBySlide((prev) => ({
                          ...prev,
                          [currentSlide]: true,
                        }))
                      }
                      onAbort={() =>
                        setFailedVideoBySlide((prev) => ({
                          ...prev,
                          [currentSlide]: true,
                        }))
                      }
                      initial={false}
                      animate={{
                        opacity: unifiedVideoRevealOpacity,
                        x: 0,
                        y: 0,
                        scale: 1,
                      }}
                      transition={
                        reduce
                          ? { duration: 0.12 }
                          : {
                              opacity: { duration: 0.55, ease: [0.2, 1, 0.32, 1] },
                            }
                      }
                      aria-hidden
                    />
                  ) : (
                    <>
                      {vidDesk && showDeskVideo ? (
                        <motion.video
                          key={`hero-vdesk-${currentSlide}-${vidDesk}`}
                          ref={(el) => {
                            videoDeskRef.current = el
                          }}
                          className="pointer-events-none absolute inset-0 z-[1] hidden h-full w-full object-cover object-center lg:block"
                          src={vidDesk}
                          autoPlay
                          muted
                          loop={false}
                          playsInline
                          preload="metadata"
                          poster={posterDesk}
                          onEnded={onHeroVideoEnded}
                          onError={() =>
                            setFailedVideoBySlide((prev) => ({
                              ...prev,
                              [currentSlide]: true,
                            }))
                          }
                          onPlaying={() =>
                            setStartedVideoBySlide((prev) => ({
                              ...prev,
                              [currentSlide]: true,
                            }))
                          }
                          onStalled={() =>
                            setFailedVideoBySlide((prev) => ({
                              ...prev,
                              [currentSlide]: true,
                            }))
                          }
                          onAbort={() =>
                            setFailedVideoBySlide((prev) => ({
                              ...prev,
                              [currentSlide]: true,
                            }))
                          }
                          initial={false}
                          animate={{
                            opacity: deskVideoRevealOpacity,
                            x: 0,
                            y: 0,
                            scale: 1,
                          }}
                          transition={
                            reduce
                              ? { duration: 0.12 }
                              : {
                                  opacity: { duration: 0.55, ease: [0.2, 1, 0.32, 1] },
                                }
                          }
                          aria-hidden
                        />
                      ) : null}
                      {vidMob && showMobVideo ? (
                        <motion.video
                          key={`hero-vmob-${currentSlide}-${vidMob}`}
                          ref={(el) => {
                            videoMobRef.current = el
                          }}
                          className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover object-center lg:hidden"
                          src={vidMob}
                          autoPlay
                          muted
                          loop={false}
                          playsInline
                          preload="metadata"
                          poster={posterMob}
                          onEnded={onHeroVideoEnded}
                          onError={() =>
                            setFailedVideoBySlide((prev) => ({
                              ...prev,
                              [currentSlide]: true,
                            }))
                          }
                          onPlaying={() =>
                            setStartedVideoBySlide((prev) => ({
                              ...prev,
                              [currentSlide]: true,
                            }))
                          }
                          onStalled={() =>
                            setFailedVideoBySlide((prev) => ({
                              ...prev,
                              [currentSlide]: true,
                            }))
                          }
                          onAbort={() =>
                            setFailedVideoBySlide((prev) => ({
                              ...prev,
                              [currentSlide]: true,
                            }))
                          }
                          initial={false}
                          animate={{
                            opacity: mobVideoRevealOpacity,
                            x: 0,
                            y: 0,
                            scale: 1,
                          }}
                          transition={
                            reduce
                              ? { duration: 0.12 }
                              : {
                                  opacity: { duration: 0.55, ease: [0.2, 1, 0.32, 1] },
                                }
                          }
                          aria-hidden
                        />
                      ) : null}
                    </>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        {showScrim ? (
          <>
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(to right, rgba(26,26,26,${0.85 * scrimA}), rgba(26,26,26,${0.55 * scrimA}), transparent)`,
              }}
              initial={false}
              animate={gradParallax}
              transition={{ type: 'spring', stiffness: 56, damping: 14 }}
              aria-hidden
            />
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 76% 24%, rgba(232,122,0,0.2), transparent 42%)',
              }}
              initial={false}
              animate={
                reduce
                  ? { opacity: 0.2 * scrimA }
                  : { opacity: [0.12 * scrimA, 0.28 * scrimA, 0.12 * scrimA] }
              }
              transition={
                reduce
                  ? { duration: 0.15 }
                  : { duration: 7.2, repeat: Infinity, ease: 'easeInOut' }
              }
              aria-hidden
            />
          </>
        ) : null}
      </div>
      <motion.div
        className="fabric-liquid-glass pointer-events-none absolute inset-y-8 right-6 z-[5] hidden w-[38%] rounded-[28px] lg:block"
        initial={reduce ? false : { opacity: 0, x: 26 }}
        animate={reduce ? undefined : { opacity: 1, x: 0 }}
        transition={{ ...easeOutSoft, delay: 0.34 }}
        aria-hidden
      />
      <motion.div
        className="relative z-10 max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col px-4 py-8 max-lg:pb-24 lg:px-10 lg:py-24 xl:py-28"
        animate={{ x: isNarrow ? 0 : depth.textX, y: isNarrow ? 0 : depth.textY }}
        transition={{ type: 'spring', stiffness: 74, damping: 16 }}
      >
        <motion.div
          key={String(currentSlide)}
          className={`max-w-2xl min-w-0 max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col max-lg:items-stretch lg:max-w-[min(48vw,36rem)] ${
            slides.length > 1 ? 'pb-4 sm:pb-6' : ''
          }`}
          initial={{ opacity: reduce ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: textSlideD, ease: [0.2, 1, 0.32, 1] }}
        >
          {showEyebrowBlock && eyebrow ? (
            <motion.p
              className="fabric-hero-badge max-lg:!hidden"
              initial={from}
              animate={to}
              transition={{ ...easeOutSoft, delay: 0.03 }}
            >
              <TextWithBr>{eyebrow}</TextWithBr>
            </motion.p>
          ) : null}
          {usp ? (
            <motion.p
              className={`fabric-hero-usp hidden max-w-2xl break-words text-[11px] uppercase leading-snug tracking-[0.16em] sm:text-xs sm:tracking-[0.18em] lg:block lg:max-w-none lg:text-sm lg:tracking-[0.2em] ${
                textClasses.uspLine
              } ${showEyebrowBlock && eyebrow ? 'mt-3' : 'mt-0'}`}
              initial={from}
              animate={to}
              transition={{ ...easeOutSoft, delay: 0.06 }}
            >
              <TextWithBr>{usp}</TextWithBr>
            </motion.p>
          ) : null}
          <motion.h1
            className={`fabric-h1 fabric-hero-title italic break-words max-lg:max-w-[min(100%,34ch)] max-lg:self-start max-lg:text-left max-lg:text-[clamp(1.875rem,5.8vw,2.35rem)] max-lg:leading-[1.1] max-lg:tracking-[0.04em] sm:max-lg:max-w-[min(100%,40ch)] sm:max-lg:text-[clamp(2rem,5.2vw,2.55rem)] lg:max-w-[min(100%,30ch)] lg:leading-[1.08] lg:tracking-[0.055em] xl:max-w-[min(100%,34ch)] xl:tracking-[0.065em] ${textClasses.heading} ${
              usp ? 'max-lg:mt-2 lg:mt-3' : 'mt-4 max-lg:mt-3'
            }`}
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.08 }}
          >
            <TextWithBr>{title}</TextWithBr>
          </motion.h1>
          <motion.p
            className={`fabric-body fabric-hero-subtitle mt-4 hidden w-full max-w-2xl text-pretty break-words font-normal uppercase tracking-[0.14em] lg:mt-6 lg:max-w-none lg:block lg:tracking-[0.13em] xl:mt-7 ${textClasses.body}`}
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.18 }}
          >
            <TextWithBr>{subtitle}</TextWithBr>
          </motion.p>
          {subtitle.trim() && (ctaSecondary.trim() || ctaPrimary.trim()) ? (
            <motion.div
              className="mt-auto flex w-full flex-row items-center gap-3 pt-5 sm:gap-4 sm:pt-6 lg:hidden"
              initial={from}
              animate={to}
              transition={{ ...easeOutSoft, delay: 0.22 }}
            >
              <div className="shrink-0">
                <MagneticHover radius={120} strength={0.16}>
                  <motion.span
                    whileHover={reduce ? undefined : subtleButtonHover}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    transition={cardHoverTransition}
                    className="inline-flex max-w-full rounded-[40px]"
                  >
                    {ctaSecondary.trim() ? (
                      secondaryIsCallback ? (
                        <button
                          type="button"
                          onClick={openCallback}
                          className={`inline-flex h-11 min-h-[44px] items-center justify-center rounded-[40px] border bg-transparent px-3.5 font-body text-xs font-medium normal-case sm:px-5 sm:text-sm ${textClasses.secondaryBtn}`}
                          style={{ letterSpacing: '0.02em' }}
                        >
                          <TextWithBr>{ctaSecondary}</TextWithBr>
                        </button>
                      ) : (
                        <HeroCtaLink
                          href={secondaryHref}
                          className={`inline-flex h-11 min-h-[44px] items-center justify-center rounded-[40px] border bg-transparent px-3.5 font-body text-xs font-medium normal-case sm:px-5 sm:text-sm ${textClasses.secondaryBtn}`}
                          style={{ letterSpacing: '0.02em' }}
                        >
                          <TextWithBr>{ctaSecondary}</TextWithBr>
                        </HeroCtaLink>
                      )
                    ) : primaryIsCallback ? (
                      <button
                        type="button"
                        onClick={openCallback}
                        className={`inline-flex h-11 min-h-[44px] items-center justify-center rounded-[40px] bg-accent px-3.5 font-body text-xs font-medium shadow-[0_3px_6px_0_rgba(232,122,0,0.3)] sm:px-5 sm:text-sm ${textClasses.primaryBtn}`}
                        style={{ letterSpacing: '0.02em' }}
                      >
                        <TextWithBr>{ctaPrimary}</TextWithBr>
                      </button>
                    ) : (
                      <HeroCtaLink
                        href={primaryHref}
                        className={`inline-flex h-11 min-h-[44px] items-center justify-center rounded-[40px] bg-accent px-3.5 font-body text-xs font-medium shadow-[0_3px_6px_0_rgba(232,122,0,0.3)] sm:px-5 sm:text-sm ${textClasses.primaryBtn}`}
                        style={{ letterSpacing: '0.02em' }}
                      >
                        <TextWithBr>{ctaPrimary}</TextWithBr>
                      </HeroCtaLink>
                    )}
                  </motion.span>
                </MagneticHover>
              </div>
              <p
                className={`min-w-0 flex-1 text-left font-body text-[10px] font-medium uppercase leading-[1.35] tracking-[0.14em] sm:text-[11px] sm:leading-snug sm:tracking-[0.12em] ${textClasses.body}`}
              >
                <TextWithBr>{subtitle}</TextWithBr>
              </p>
            </motion.div>
          ) : subtitle.trim() ? (
            <motion.p
              className={`fabric-body mt-auto pt-5 font-body text-[10px] font-normal uppercase leading-snug tracking-[0.1em] sm:pt-6 lg:hidden ${textClasses.body}`}
              initial={from}
              animate={to}
              transition={{ ...easeOutSoft, delay: 0.22 }}
            >
              <TextWithBr>{subtitle}</TextWithBr>
            </motion.p>
          ) : null}
          <motion.div
            className="mt-8 hidden min-w-0 flex-wrap items-center gap-4 sm:gap-5 lg:mt-10 lg:flex lg:flex-nowrap xl:mt-12 xl:gap-6"
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.28 }}
          >
            {ctaPrimary.trim() ? (
              <PulsingCTA>
                <MagneticHover radius={155} strength={0.21}>
                  <motion.span
                    whileHover={reduce ? undefined : subtleButtonHover}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    transition={cardHoverTransition}
                    className="inline-flex shadow-[0_4px_8px_0_rgba(232,122,0,0.35)]"
                    style={{ borderRadius: 40 }}
                  >
                    {primaryIsCallback ? (
                      <button
                        type="button"
                        onClick={openCallback}
                        className={`${primaryBtnClass} ${textClasses.primaryBtn}`}
                        style={{ letterSpacing: '0.02em' }}
                      >
                        <TextWithBr>{ctaPrimary}</TextWithBr>
                      </button>
                    ) : (
                      <HeroCtaLink
                        href={primaryHref}
                        className={`${primaryBtnClass} ${textClasses.primaryBtn}`}
                        style={{ letterSpacing: '0.02em' }}
                      >
                        <TextWithBr>{ctaPrimary}</TextWithBr>
                      </HeroCtaLink>
                    )}
                  </motion.span>
                </MagneticHover>
              </PulsingCTA>
            ) : null}
            {ctaSecondary.trim() ? (
              <MagneticHover radius={145} strength={0.18}>
                <motion.span
                  whileHover={reduce ? undefined : subtleButtonHover}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  transition={cardHoverTransition}
                  className="inline-flex rounded-[40px]"
                >
                  {secondaryIsCallback ? (
                    <button
                      type="button"
                      onClick={openCallback}
                      className={`${secondaryBtnClass} lg:border ${textClasses.secondaryBtn}`}
                      style={{ letterSpacing: '0.02em' }}
                    >
                      <TextWithBr>{ctaSecondary}</TextWithBr>
                    </button>
                  ) : (
                    <HeroCtaLink
                      href={secondaryHref}
                      className={`${secondaryBtnClass} lg:border ${textClasses.secondaryBtn}`}
                      style={{ letterSpacing: '0.02em' }}
                    >
                      <TextWithBr>{ctaSecondary}</TextWithBr>
                    </HeroCtaLink>
                  )}
                </motion.span>
              </MagneticHover>
            ) : null}
          </motion.div>
          {heroStats.length ? (
            <motion.div
              className="fabric-liquid-glass-soft mt-8 hidden max-w-xl grid-cols-1 gap-2 rounded-2xl p-3 sm:grid-cols-3 lg:grid"
              initial={from}
              animate={to}
              transition={{ ...easeOutSoft, delay: 0.35 }}
            >
              {heroStats.map((item, idx) => (
                <div
                  key={`hero-stat-${idx}`}
                  className={`fabric-liquid-glass-soft rounded-xl px-3 py-2 text-center ${textClasses.chipBg}`}
                >
                  <p className="font-heading text-lg text-text">
                    <TextWithBr>{item.value}</TextWithBr>
                  </p>
                  <p className="font-body text-[11px] uppercase tracking-wider text-text-muted">
                    <TextWithBr>{item.label}</TextWithBr>
                  </p>
                </div>
              ))}
            </motion.div>
          ) : null}
          {hasTrustBlock ? (
            <motion.div
              className="mt-6 hidden space-y-3 lg:block"
              initial={from}
              animate={to}
              transition={{ ...easeOutSoft, delay: 0.4 }}
            >
              {showTrustBlockLine && trustLine ? (
                <p className={`font-body text-sm sm:text-base ${textClasses.subtle}`}>
                  <TextWithBr>{trustLine}</TextWithBr>
                </p>
              ) : null}
              {trustItems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {trustItems.map((item, idx) =>
                    item && showTrustI(idx as 0 | 1 | 2) ? (
                      <span
                        key={`hero-trust-${idx}`}
                        className={`fabric-liquid-glass-soft inline-flex max-w-full items-center rounded-full px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.08em] leading-relaxed break-words ${textClasses.trustPill}`}
                      >
                        <TextWithBr>{item}</TextWithBr>
                      </span>
                    ) : null,
                  )}
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </motion.div>
      </motion.div>
      {slides.length > 1 ? (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex flex-col items-stretch"
          role="group"
          aria-label="Слайды hero: точки и перелистывание"
        >
          <div className="pointer-events-auto flex justify-center px-3 pb-2.5 sm:px-4">
            <div className="fabric-liquid-glass-soft inline-flex max-w-full min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-2 py-1.5 shadow-sm backdrop-blur-sm sm:gap-3 sm:px-2.5 sm:py-2">
              {carouselArrows ? (
                <button
                  type="button"
                  onClick={carouselArrows.prev}
                  disabled={callbackOpen}
                  className={carouselArrowBtnClass}
                  aria-label="Предыдущий слайд"
                >
                  <svg
                    className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              ) : null}
              <div className="flex min-w-0 max-w-full flex-1 items-center justify-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={`hero-slide-dot-${idx}`}
                    type="button"
                    aria-label={`Слайд ${idx + 1}`}
                    aria-pressed={idx === currentSlide}
                    disabled={callbackOpen}
                    onClick={() => {
                      if (callbackOpen) return
                      setCurrentSlide(idx)
                    }}
                    className={`h-2.5 shrink-0 rounded-full transition-all enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 ${
                      idx === currentSlide
                        ? 'w-8 bg-accent'
                        : `w-2.5 ${textClasses.slideDotOff}`
                    }`}
                  />
                ))}
              </div>
              {carouselArrows ? (
                <button
                  type="button"
                  onClick={carouselArrows.next}
                  disabled={callbackOpen}
                  className={carouselArrowBtnClass}
                  aria-label="Следующий слайд"
                >
                  <svg
                    className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
          {showCarouselProgress ? (
            <div
              className="h-1 w-full overflow-hidden rounded-b-[24px] bg-white/12"
              aria-hidden
            >
              <div
                className="h-full w-full origin-left bg-accent/95"
                style={{ transform: `scaleX(${barProgress})` }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
