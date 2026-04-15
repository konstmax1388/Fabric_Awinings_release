import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Title, useGetList } from 'react-admin'

import {
  postBitrix24CatalogSync,
  postBitrix24WebhookTest,
  postOzonPayTest,
  postSmtpTest,
  postWbImport,
  type WbImportRow,
} from '../../api/staffApi'
import { djangoClassicAdminUrl } from '../../lib/apiBase'

export default function ServicePage() {
  const { data: categories, isPending: catLoading } = useGetList('product-categories', {
    pagination: { page: 1, perPage: 500 },
    sort: { field: 'sortOrder', order: 'ASC' },
  })

  const [wbUrls, setWbUrls] = useState('')
  const [wbCategory, setWbCategory] = useState('')
  const [wbPublish, setWbPublish] = useState(true)
  const [wbDry, setWbDry] = useState(true)
  const [wbBusy, setWbBusy] = useState(false)
  const [wbErr, setWbErr] = useState<string | null>(null)
  const [wbRows, setWbRows] = useState<WbImportRow[] | null>(null)

  const [smtpTo, setSmtpTo] = useState('')
  const [smtpBusy, setSmtpBusy] = useState(false)
  const [smtpErr, setSmtpErr] = useState<string | null>(null)
  const [smtpOk, setSmtpOk] = useState<string | null>(null)

  const [ozonBusy, setOzonBusy] = useState(false)
  const [ozonErr, setOzonErr] = useState<string | null>(null)
  const [ozonOk, setOzonOk] = useState<string | null>(null)
  const [ozonPayLink, setOzonPayLink] = useState<string | null>(null)
  const [ozonRaw, setOzonRaw] = useState<string | null>(null)

  const [b24Busy, setB24Busy] = useState(false)
  const [b24Err, setB24Err] = useState<string | null>(null)
  const [b24Out, setB24Out] = useState<unknown>(null)

  const [syncDry, setSyncDry] = useState(true)
  const [syncForce, setSyncForce] = useState(false)
  const [syncSkipVar, setSyncSkipVar] = useState(false)
  const [syncSkipProd, setSyncSkipProd] = useState(false)
  const [syncNoProducts, setSyncNoProducts] = useState(false)
  const [syncNoOffers, setSyncNoOffers] = useState(false)
  const [syncTimeout, setSyncTimeout] = useState(120)
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncErr, setSyncErr] = useState<string | null>(null)
  const [syncOut, setSyncOut] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (categories?.length && !wbCategory) {
      setWbCategory(String(categories[0].id))
    }
  }, [categories, wbCategory])

  const runWb = async () => {
    const lines = wbUrls
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!lines.length) {
      setWbErr('Укажите хотя бы один URL')
      return
    }
    const cid = Number(wbCategory)
    if (!Number.isFinite(cid)) {
      setWbErr('Выберите категорию')
      return
    }
    setWbBusy(true)
    setWbErr(null)
    setWbRows(null)
    try {
      const r = await postWbImport({
        urls: lines,
        categoryId: cid,
        publish: wbPublish,
        dryRun: wbDry,
      })
      setWbRows(r.results)
    } catch (e) {
      setWbErr(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setWbBusy(false)
    }
  }

  const runSmtp = async () => {
    setSmtpBusy(true)
    setSmtpErr(null)
    setSmtpOk(null)
    try {
      const r = await postSmtpTest({ toEmail: smtpTo.trim() || undefined })
      if (!r.ok) setSmtpErr(r.detail || 'Ошибка SMTP')
      else setSmtpOk(r.detail || 'OK')
    } catch (e) {
      setSmtpErr(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSmtpBusy(false)
    }
  }

  const runOzonPay = async () => {
    setOzonBusy(true)
    setOzonErr(null)
    setOzonOk(null)
    setOzonPayLink(null)
    setOzonRaw(null)
    try {
      const r = await postOzonPayTest()
      setOzonRaw(r.raw)
      if (r.ok && r.payLink) {
        setOzonOk(r.detail)
        setOzonPayLink(r.payLink)
      } else {
        setOzonErr(r.detail || 'Ошибка Ozon Pay')
      }
    } catch (e) {
      setOzonErr(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setOzonBusy(false)
    }
  }

  const runB24Test = async () => {
    setB24Busy(true)
    setB24Err(null)
    setB24Out(null)
    try {
      const r = await postBitrix24WebhookTest()
      setB24Out(r.results)
    } catch (e) {
      setB24Err(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setB24Busy(false)
    }
  }

  const runB24Sync = async () => {
    setSyncBusy(true)
    setSyncErr(null)
    setSyncOut(null)
    try {
      const r = await postBitrix24CatalogSync({
        dryRun: syncDry,
        force: syncForce,
        skipVariants: syncSkipVar,
        skipProducts: syncSkipProd,
        noProducts: syncNoProducts,
        noOffers: syncNoOffers,
        timeoutSec: syncTimeout,
      })
      setSyncOut(r.summary as Record<string, unknown>)
    } catch (e) {
      setSyncErr(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSyncBusy(false)
    }
  }

  return (
    <Box sx={{ p: 2, maxWidth: 900 }}>
      <Title title="Сервис" />
      <Typography variant="h5" gutterBottom>
        Сервисные операции
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Все модели из Django Unfold, которые были в проекте, доступны в этом SPA: каталог, заказы, лиды, контент,
        настройки сайта, главная, шаблоны писем, пользователи, группы, профили покупателей, адреса доставки. Ниже —
        сервисные действия (импорт WB, SMTP, Ozon Pay, Битрикс). Классический Django оставлен как запасной вход.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
        <Typography variant="subtitle1" gutterBottom>
          Классическая админка Django (Unfold)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Редкие операции и всё, что ещё не вынесено в React Admin, остаются в Unfold:{' '}
          <code style={{ fontSize: '0.85em' }}>{djangoClassicAdminUrl()}</code>
        </Typography>
        <Button
          href={djangoClassicAdminUrl()}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          color="inherit"
        >
          Открыть Django Admin
        </Button>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Импорт с Wildberries
        </Typography>
        <TextField
          label="URL карточек (по одному в строке)"
          value={wbUrls}
          onChange={(e) => setWbUrls(e.target.value)}
          fullWidth
          multiline
          minRows={4}
        />
        <TextField
          select
          label="Категория каталога"
          value={wbCategory}
          onChange={(e) => setWbCategory(e.target.value)}
          fullWidth
          sx={{ mt: 2 }}
          disabled={catLoading}
        >
          {(categories ?? []).map((c) => (
            <MenuItem key={String(c.id)} value={String(c.id)}>
              {(c.title as string) ?? c.id}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel control={<Checkbox checked={wbPublish} onChange={(e) => setWbPublish(e.target.checked)} />} label="Публиковать" />
        <FormControlLabel control={<Checkbox checked={wbDry} onChange={(e) => setWbDry(e.target.checked)} />} label="Dry-run (без записи в БД)" />
        {wbErr ? <Alert severity="error">{wbErr}</Alert> : null}
        <Button sx={{ mt: 1 }} variant="contained" disabled={wbBusy} onClick={() => void runWb()}>
          Запустить
        </Button>
        {wbRows ? (
          <Box sx={{ mt: 2 }}>
            {wbRows.map((row, i) => (
              <Typography key={i} variant="body2" color={row.ok ? 'success.main' : 'error'}>
                {row.url}: {row.message}
              </Typography>
            ))}
          </Box>
        ) : null}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Проверка SMTP
        </Typography>
        <TextField
          label="Кому отправить (пусто — из настроек / email пользователя)"
          value={smtpTo}
          onChange={(e) => setSmtpTo(e.target.value)}
          fullWidth
        />
        {smtpErr ? <Alert severity="error">{smtpErr}</Alert> : null}
        {smtpOk ? <Alert severity="success">{smtpOk}</Alert> : null}
        <Button sx={{ mt: 1 }} variant="outlined" disabled={smtpBusy} onClick={() => void runSmtp()}>
          Отправить тест
        </Button>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Проверка Ozon Pay
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Один вызов createOrder (тестовая сумма из OZON_PAY_TEST_AMOUNT_RUB, по умолчанию 10 ₽). Настройки — секция
          «Онлайн-оплата Ozon Pay» в настройках сайта.
        </Typography>
        {ozonErr ? <Alert severity="error">{ozonErr}</Alert> : null}
        {ozonOk ? <Alert severity="success">{ozonOk}</Alert> : null}
        {ozonPayLink ? (
          <Typography variant="body2" sx={{ mt: 1 }}>
            <a href={ozonPayLink} target="_blank" rel="noopener noreferrer">
              Открыть ссылку на оплату
            </a>
          </Typography>
        ) : null}
        <Button sx={{ mt: 1 }} variant="outlined" disabled={ozonBusy} onClick={() => void runOzonPay()}>
          Запустить тест
        </Button>
        {ozonRaw ? (
          <Typography variant="body2" sx={{ mt: 2, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {ozonRaw}
          </Typography>
        ) : null}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Битрикс24: тест вебхука
        </Typography>
        {b24Err ? <Alert severity="error">{b24Err}</Alert> : null}
        <Button variant="outlined" disabled={b24Busy} onClick={() => void runB24Test()}>
          Запустить тест
        </Button>
        {b24Out != null ? (
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {JSON.stringify(b24Out, null, 2)}
          </Typography>
        ) : null}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Битрикс24: синхронизация каталога
        </Typography>
        <FormControlLabel control={<Checkbox checked={syncDry} onChange={(e) => setSyncDry(e.target.checked)} />} label="Dry-run" />
        <FormControlLabel control={<Checkbox checked={syncForce} onChange={(e) => setSyncForce(e.target.checked)} />} label="Force" />
        <FormControlLabel control={<Checkbox checked={syncSkipVar} onChange={(e) => setSyncSkipVar(e.target.checked)} />} label="Пропуск вариантов" />
        <FormControlLabel control={<Checkbox checked={syncSkipProd} onChange={(e) => setSyncSkipProd(e.target.checked)} />} label="Пропуск товаров" />
        <FormControlLabel control={<Checkbox checked={syncNoProducts} onChange={(e) => setSyncNoProducts(e.target.checked)} />} label="Не тянуть товары (noProducts)" />
        <FormControlLabel control={<Checkbox checked={syncNoOffers} onChange={(e) => setSyncNoOffers(e.target.checked)} />} label="Не тянуть офферы (noOffers)" />
        <TextField
          label="Таймаут, сек"
          type="number"
          value={syncTimeout}
          onChange={(e) => setSyncTimeout(Number(e.target.value) || 120)}
          sx={{ mt: 1, maxWidth: 200 }}
        />
        {syncErr ? <Alert severity="error">{syncErr}</Alert> : null}
        <Button sx={{ mt: 1 }} variant="contained" color="warning" disabled={syncBusy} onClick={() => void runB24Sync()}>
          Синхронизировать
        </Button>
        {syncOut ? (
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {JSON.stringify(syncOut, null, 2)}
          </Typography>
        ) : null}
      </Paper>
    </Box>
  )
}
