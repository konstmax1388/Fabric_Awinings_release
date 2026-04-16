import type { ReactNode } from 'react'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import PhoneCallbackOutlinedIcon from '@mui/icons-material/PhoneCallbackOutlined'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCreatePath } from 'ra-core'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { BRAND } from '../lib/branding'
import { staffApiUrl } from '../lib/apiBase'
import { staffFetchJson } from '../providers/httpStaff'

type DayCount = { date: string; count: number }
type TopProduct = { productId: string; title: string; qty: number }

type Metrics = {
  schemaVersion?: number
  generatedAt?: string
  orders?: {
    total?: number
    last7Days?: number
    newReceived?: number
    byDay?: DayCount[]
  }
  topProducts?: TopProduct[]
  callbackLeads?: { total?: number; last30Days?: number }
  products?: { published?: number; totalInDb?: number }
}

function formatChartDay(iso: string): string {
  try {
    const d = new Date(`${iso}T12:00:00`)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  } catch {
    return iso
  }
}

/** Staff API товара — по числовому pk; в lines иногда только slug. */
function isStaffProductPk(key: string): boolean {
  return /^\d+$/.test(String(key).trim())
}

/** Столбики без recharts — не ломается в Docker при устаревшем node_modules. */
function OrdersByDayBarChart({ rows }: { rows: { date: string; count: number }[] }) {
  const data = rows.map((row) => ({
    ...row,
    day: formatChartDay(row.date),
  }))
  const max = Math.max(1, ...data.map((d) => d.count))

  if (data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
        Нет данных за период.
      </Typography>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 0.25,
        height: 240,
        pt: 1,
        pb: 0.5,
        px: 0.5,
        borderBottom: `1px solid ${alpha(BRAND.text, 0.08)}`,
        borderLeft: `1px solid ${alpha(BRAND.text, 0.08)}`,
      }}
    >
      {data.map((d) => (
        <Tooltip key={d.date} title={`${d.day}: ${d.count} заказов`} placement="top" enterDelay={200}>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
              justifyContent: 'flex-end',
            }}
          >
            <Box
              sx={{
                width: 'min(100%, 40px)',
                height: `${Math.max(4, (d.count / max) * 200)}px`,
                minHeight: d.count > 0 ? 4 : 0,
                bgcolor: BRAND.accent,
                borderRadius: '6px 6px 0 0',
                transition: 'opacity 0.15s',
                '&:hover': { opacity: 0.88 },
              }}
              role="img"
              aria-label={`${d.day}, заказов: ${d.count}`}
            />
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                fontSize: '0.65rem',
                lineHeight: 1.1,
                color: 'text.secondary',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                transform: 'rotate(-32deg)',
                transformOrigin: 'top center',
                height: 36,
                pt: 0.5,
              }}
            >
              {d.day}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  )
}

type QuickLink = {
  label: string
  to: string
  hint: string
}

function StatCard(props: {
  title: string
  value: ReactNode
  subtitle: string
  icon: ReactNode
  accent: string
  loading: boolean
  to: string
}) {
  const { title, value, subtitle, icon, accent, loading, to } = props
  return (
    <Card
      component={RouterLink}
      to={to}
      aria-label={`Открыть раздел: ${title}`}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 12px 40px ${alpha(BRAND.text, 0.08)}, 0 1px 2px ${alpha(BRAND.text, 0.04)}`,
        },
        '&:focus-visible': {
          outline: `2px solid ${accent}`,
          outlineOffset: 2,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: accent,
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={100} height={48} />
            ) : (
              <Typography variant="h4" component="p" sx={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
                {value}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.5 }}>
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(accent, 0.12),
              color: accent,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function StaffDashboard() {
  const createPath = useCreatePath()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = (await staffFetchJson(
          staffApiUrl('/api/staff/v1/metrics/overview/'),
        )) as Metrics
        if (!cancelled) setMetrics(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loading = metrics === null && error === null

  const quickLinks: QuickLink[] = [
    { label: 'Заказы', to: createPath({ resource: 'orders', type: 'list' }), hint: 'Оплаты, статусы, доставка' },
    { label: 'Товары', to: createPath({ resource: 'products', type: 'list' }), hint: 'Карточки и цены на витрине' },
    { label: 'Категории', to: createPath({ resource: 'product-categories', type: 'list' }), hint: 'Структура каталога' },
    { label: 'Главная страница', to: '/home-content', hint: 'Тексты и блоки на главной' },
    {
      label: 'Обратный звонок',
      to: createPath({ resource: 'callback-leads', type: 'list' }),
      hint: 'Заявки с формы на сайте',
    },
    {
      label: 'Калькулятор',
      to: createPath({ resource: 'calculator-leads', type: 'list' }),
      hint: 'Расчёты и обращения',
    },
  ]

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        maxWidth: 1280,
        mx: 'auto',
        width: '100%',
        boxSizing: 'border-box',
        flex: '0 1 auto',
        minHeight: 0,
      }}
    >
      <Card
        sx={{
          mb: 3,
          background: `linear-gradient(125deg, ${BRAND.greenDark} 0%, ${BRAND.accentDark} 42%, ${BRAND.accent} 100%)`,
          color: 'common.white',
          border: 'none',
          boxShadow: `0 16px 48px ${alpha(BRAND.accent, 0.35)}`,
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 2, justifyContent: 'space-between' }}>
            <Box sx={{ maxWidth: 640 }}>
              <Chip
                label="Рабочая панель"
                size="small"
                sx={{
                  mb: 1.5,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'common.white',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  fontSize: '0.65rem',
                }}
              />
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  mb: 1,
                  fontFamily: '"Playfair Display", Georgia, serif',
                }}
              >
                Добро пожаловать
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.92, lineHeight: 1.65, fontSize: '1.05rem' }}>
                Заказы, витрина и контент — в одном месте. Технические настройки сайта и интеграций перенесены в Django
                Admin, чтобы случайно не нарушить работу витрины.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.9 }}>
              {loading ? <CircularProgress size={28} sx={{ color: 'common.white' }} /> : null}
              <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 220, lineHeight: 1.45 }}>
                Цифры подтягиваются заново каждый раз, когда вы открываете «Обзор».
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.12em', color: 'text.secondary', display: 'block', mb: 1.5 }}>
        С чего начать
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 1.5,
          mb: 4,
        }}
      >
        {quickLinks.map((q) => (
          <Box key={q.to} sx={{ minWidth: 0 }}>
            <Button
              component={RouterLink}
              to={q.to}
              fullWidth
              variant="outlined"
              color="inherit"
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1.5,
                py: 2,
                px: 2.25,
                minHeight: 76,
                borderRadius: 999,
                borderColor: 'rgba(15, 23, 42, 0.12)',
                bgcolor: 'background.paper',
                color: 'text.primary',
                textAlign: 'left',
                textTransform: 'none',
                whiteSpace: 'normal',
                fontWeight: 600,
                '& .MuiButton-endIcon': {
                  ml: 0,
                  alignSelf: 'center',
                  flexShrink: 0,
                },
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: alpha(BRAND.accent, 0.06),
                },
              }}
              endIcon={<ArrowForwardIcon sx={{ opacity: 0.45, fontSize: 22 }} />}
            >
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="subtitle1"
                  component="div"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.25,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {q.label}
                </Typography>
                <Typography
                  variant="body2"
                  component="div"
                  color="text.secondary"
                  sx={{
                    fontWeight: 400,
                    lineHeight: 1.45,
                    fontSize: '0.8125rem',
                  }}
                >
                  {q.hint}
                </Typography>
              </Box>
            </Button>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.12em', color: 'text.secondary' }}>
          Сводка
        </Typography>
        <TrendingFlatIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
      </Box>

      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 2.5,
        }}
      >
        <StatCard
          title="Заказы"
          value={metrics?.orders?.total ?? '—'}
          subtitle={`Новых «принят»: ${metrics?.orders?.newReceived ?? '—'} · за 7 дней: ${metrics?.orders?.last7Days ?? '—'}`}
          icon={<ShoppingCartOutlinedIcon />}
          accent={BRAND.accent}
          loading={loading}
          to={createPath({ resource: 'orders', type: 'list' })}
        />
        <StatCard
          title="Обратный звонок"
          value={metrics?.callbackLeads?.total ?? '—'}
          subtitle={`Заявок за 30 дней: ${metrics?.callbackLeads?.last30Days ?? '—'}`}
          icon={<PhoneCallbackOutlinedIcon />}
          accent={BRAND.green}
          loading={loading}
          to={createPath({ resource: 'callback-leads', type: 'list' })}
        />
        <StatCard
          title="Товары"
          value={metrics?.products?.published ?? '—'}
          subtitle={`На витрине · всего в базе: ${metrics?.products?.totalInDb ?? '—'}`}
          icon={<Inventory2OutlinedIcon />}
          accent={BRAND.accentDark}
          loading={loading}
          to={createPath({ resource: 'products', type: 'list' })}
        />
      </Box>

      <Typography
        variant="overline"
        sx={{
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: 'text.secondary',
          display: 'block',
          mt: 4,
          mb: 1.5,
        }}
      >
        Аналитика заказов (14 дней · топ товаров за 30 дней)
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' },
          gap: 2.5,
        }}
      >
        <Card sx={{ height: '100%', minHeight: 320 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Заказы по дням
            </Typography>
            {loading ? (
              <Skeleton variant="rounded" height={260} sx={{ mt: 1 }} />
            ) : (
              <Box sx={{ width: '100%', mt: 1 }}>
                <OrdersByDayBarChart rows={metrics?.orders?.byDay ?? []} />
              </Box>
            )}
          </CardContent>
        </Card>
        <Card sx={{ height: '100%', minHeight: 320 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Чаще всего в заказах
            </Typography>
            {loading ? (
              <Skeleton variant="text" height={28} sx={{ mt: 1 }} />
            ) : (metrics?.topProducts?.length ?? 0) === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Нет данных по заказам за выбранный период.
              </Typography>
            ) : (
              <Box component="ol" sx={{ m: 0, pl: 2.25, mt: 1 }}>
                {(metrics?.topProducts ?? []).map((p) => (
                  <Box component="li" key={p.productId} sx={{ mb: 1.25 }}>
                    {isStaffProductPk(p.productId) ? (
                      <Button
                        component={RouterLink}
                        to={createPath({ resource: 'products', type: 'edit', id: p.productId })}
                        size="small"
                        sx={{
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          textTransform: 'none',
                          fontWeight: 600,
                          p: 0,
                          minWidth: 0,
                          color: 'primary.main',
                        }}
                      >
                        {p.title}
                      </Button>
                    ) : (
                      <Typography variant="body2" fontWeight={600}>
                        {p.title}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block">
                      {p.qty} шт. в позициях
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
