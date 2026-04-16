import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { Box, Button, Paper, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useRecordContext, useRefresh } from 'react-admin'

import { reorderProductImages, reorderProductVariants } from '../../api/staffApi'

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir
  if (j < 0 || j >= arr.length) return arr
  const next = [...arr]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

export function ProductVariantReorderPanel() {
  const record = useRecordContext()
  const refresh = useRefresh()
  const [ids, setIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    const v = record?.variants
    if (Array.isArray(v)) {
      setIds(v.map((x: { id: string }) => String(x.id)))
    }
  }, [record])

  const apply = useCallback(async () => {
    if (!record?.id) return
    setBusy(true)
    setMsg(null)
    try {
      await reorderProductVariants(String(record.id), ids)
      setMsg('Порядок вариантов сохранён')
      refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }, [record, ids, refresh])

  if (!record?.id) return null

  return (
    <Paper variant="outlined" sx={{ p: 2, maxWidth: 560 }}>
      <Typography variant="subtitle1" gutterBottom>
        Порядок вариантов
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Вверх/вниз, затем «Сохранить порядок». Должны быть перечислены все варианты товара.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {ids.map((id, i) => (
          <Box key={id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ flex: 1, fontFamily: 'monospace' }}>
              {id}
            </Typography>
            <Button size="small" disabled={busy || i === 0} onClick={() => setIds((a) => move(a, i, -1))}>
              <ArrowUpwardIcon fontSize="small" />
            </Button>
            <Button
              size="small"
              disabled={busy || i === ids.length - 1}
              onClick={() => setIds((a) => move(a, i, 1))}
            >
              <ArrowDownwardIcon fontSize="small" />
            </Button>
          </Box>
        ))}
      </Box>
      <Button sx={{ mt: 1 }} variant="contained" disabled={busy || ids.length === 0} onClick={() => void apply()}>
        Сохранить порядок вариантов
      </Button>
      {msg ? (
        <Typography variant="body2" sx={{ mt: 1 }} color={msg.startsWith('Ошибка') ? 'error' : 'success.main'}>
          {msg}
        </Typography>
      ) : null}
    </Paper>
  )
}

export function ProductImageReorderPanel() {
  const record = useRecordContext()
  const refresh = useRefresh()
  const [ids, setIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    const v = record?.images
    if (Array.isArray(v)) {
      setIds(v.map((x: { id: string }) => String(x.id)))
    }
  }, [record])

  const apply = useCallback(async () => {
    if (!record?.id) return
    setBusy(true)
    setMsg(null)
    try {
      await reorderProductImages(String(record.id), ids)
      setMsg('Порядок изображений сохранён')
      refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }, [record, ids, refresh])

  if (!record?.id) return null

  return (
    <Paper variant="outlined" sx={{ p: 2, maxWidth: 560 }}>
      <Typography variant="subtitle1" gutterBottom>
        Порядок изображений
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {ids.map((id, i) => (
          <Box key={id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ flex: 1, fontFamily: 'monospace' }}>
              {id}
            </Typography>
            <Button size="small" disabled={busy || i === 0} onClick={() => setIds((a) => move(a, i, -1))}>
              <ArrowUpwardIcon fontSize="small" />
            </Button>
            <Button
              size="small"
              disabled={busy || i === ids.length - 1}
              onClick={() => setIds((a) => move(a, i, 1))}
            >
              <ArrowDownwardIcon fontSize="small" />
            </Button>
          </Box>
        ))}
      </Box>
      <Button sx={{ mt: 1 }} variant="contained" disabled={busy || ids.length === 0} onClick={() => void apply()}>
        Сохранить порядок изображений
      </Button>
      {msg ? (
        <Typography variant="body2" sx={{ mt: 1 }} color={msg.startsWith('Ошибка') ? 'error' : 'success.main'}>
          {msg}
        </Typography>
      ) : null}
    </Paper>
  )
}
