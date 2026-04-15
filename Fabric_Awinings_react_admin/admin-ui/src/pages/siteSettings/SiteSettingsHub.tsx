import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Title } from 'react-admin'

import { fetchSiteSettingsCurrent } from '../../api/staffApi'
import { SITE_SETTINGS_SECTION_LABELS } from './siteLabels'

export default function SiteSettingsHub() {
  const [order, setOrder] = useState<string[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const data = (await fetchSiteSettingsCurrent()) as { sectionOrder?: string[] }
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
    <Box sx={{ p: 2 }}>
      <Title title="Настройки сайта" />
      <Typography variant="h5" gutterBottom>
        Настройки сайта
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Блоки совпадают с Django Unfold. Секреты в списках замаскированы; для смены используйте поля «…New» в
        соответствующих секциях.
      </Typography>
      {err ? (
        <Typography color="error">{err}</Typography>
      ) : (
        <Box sx={{ mb: 2 }}>
          <Button component={Link} to="/site-settings/current" variant="contained" sx={{ mr: 1, mb: 1 }}>
            Все поля (одним списком)
          </Button>
        </Box>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {order.map((slug) => (
          <Card key={slug} variant="outlined" sx={{ flex: '1 1 280px', minWidth: 0 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {SITE_SETTINGS_SECTION_LABELS[slug] ?? slug}
              </Typography>
              <Button
                component={Link}
                to={`/site-settings/sections/${encodeURIComponent(slug)}`}
                size="small"
                variant="outlined"
              >
                Редактировать
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
