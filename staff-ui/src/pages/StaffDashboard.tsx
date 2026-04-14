import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { Box, Card, CardContent, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Title } from 'react-admin'

import { staffApiUrl } from '../lib/apiBase'
import { staffFetchJson } from '../providers/httpStaff'

type Metrics = {
  schemaVersion?: number
  generatedAt?: string
  orders?: { total?: number; last7Days?: number; newReceived?: number }
  callbackLeads?: { total?: number; last30Days?: number }
  products?: { published?: number; totalInDb?: number }
}

export default function StaffDashboard() {
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

  return (
    <Box sx={{ p: 2 }}>
      <Title title="Сводка" />
      <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 2 }}>
        Сводка
      </Typography>
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : null}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <Card variant="outlined" sx={{ flex: '1 1 260px', minWidth: 0 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ShoppingCartIcon color="primary" />
              <Typography variant="subtitle1">Заказы</Typography>
            </Box>
            <Typography variant="h4">{metrics?.orders?.total ?? '…'}</Typography>
            <Typography variant="body2" color="text.secondary">
              Новых «принят»: {metrics?.orders?.newReceived ?? '—'} · за 7 дн.:{' '}
              {metrics?.orders?.last7Days ?? '—'}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: '1 1 260px', minWidth: 0 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PhoneCallbackIcon color="primary" />
              <Typography variant="subtitle1">Обратный звонок</Typography>
            </Box>
            <Typography variant="h4">{metrics?.callbackLeads?.total ?? '…'}</Typography>
            <Typography variant="body2" color="text.secondary">
              За 30 дней: {metrics?.callbackLeads?.last30Days ?? '—'}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: '1 1 260px', minWidth: 0 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Товары
            </Typography>
            <Typography variant="h4">{metrics?.products?.published ?? '…'}</Typography>
            <Typography variant="body2" color="text.secondary">
              На витрине · всего в базе: {metrics?.products?.totalInDb ?? '—'}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
