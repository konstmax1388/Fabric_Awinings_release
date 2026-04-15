import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Title } from 'react-admin'

import { fetchHomeContentCurrent } from '../../api/staffApi'
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
    <Box sx={{ p: 2 }}>
      <Title title="Главная страница" />
      <Typography variant="h5" gutterBottom>
        Контент главной страницы
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Секции и валидации совпадают с Django Admin. Изображения — через загрузку, в API уходит relativePath.
      </Typography>
      {err ? (
        <Typography color="error">{err}</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {order.map((slug) => (
            <Card key={slug} variant="outlined" sx={{ flex: '1 1 280px', minWidth: 0 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {HOME_SECTION_LABELS[slug] ?? slug}
                </Typography>
                <Button
                  component={Link}
                  to={`./sections/${encodeURIComponent(slug)}`}
                  size="small"
                  variant="outlined"
                >
                  Редактировать
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  )
}
