import { alpha, Box, Button, Card, CardContent, Chip, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Title } from 'react-admin'

import { fetchHomeContentCurrent } from '../../api/staffApi'
import { BRAND } from '../../lib/branding'
import { HOME_SECTION_LABELS } from './homeLabels'

export default function HomeContentHub() {
  const [order, setOrder] = useState<string[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const data = (await fetchHomeContentCurrent()) as { sectionOrder?: string[] }
        if (!c && Array.isArray(data.sectionOrder)) setOrder(data.sectionOrder)
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'Ошибка загрузки')
      }
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto', width: '100%', boxSizing: 'border-box' }}>
      <Title title="Главная страница" />
      <Card
        sx={{
          mb: 3,
          border: `1px solid ${alpha(BRAND.accent, 0.2)}`,
          background: `linear-gradient(120deg, ${alpha(BRAND.accent, 0.08)} 0%, ${alpha(BRAND.green, 0.05)} 100%)`,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Chip label="Главная витрины" size="small" color="primary" sx={{ mb: 1.5, fontWeight: 700 }} />
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Блоки главной страницы
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: 720 }}>
            Ниже — те же разделы, что идут на сайте сверху вниз (герой, каталог, отзывы и т.д.). Откройте карточку,
            чтобы изменить тексты и картинки. Технические настройки сайта остаются в Django Admin.
          </Typography>
        </CardContent>
      </Card>
      {err ? (
        <Typography color="error">{err}</Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {order.map((slug) => (
            <Card
              key={slug}
              variant="outlined"
              sx={{
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: `0 8px 28px ${alpha(BRAND.text, 0.06)}`,
                },
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.35 }}>
                  {HOME_SECTION_LABELS[slug] ?? slug}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                  Редактирование полей этого блока на сайте
                </Typography>
                <Box sx={{ mt: 'auto', pt: 0.5 }}>
                  <Button component={Link} to={`./sections/${encodeURIComponent(slug)}`} variant="contained" size="small">
                    Открыть редактор
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  )
}
