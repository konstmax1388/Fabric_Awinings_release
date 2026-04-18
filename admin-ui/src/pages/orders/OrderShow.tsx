import {
  DateField,
  EditButton,
  FunctionField,
  NumberField,
  Show,
  SimpleShowLayout,
  TextField,
  TopToolbar,
  useRecordContext,
} from 'react-admin'
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import {
  BITRIX_SYNC_STATUS_RU,
  DELIVERY_METHOD_RU,
  enumLabelRu,
  FULFILLMENT_STATUS_RU,
  PAYMENT_METHOD_RU,
  PAYMENT_STATUS_RU,
} from '../../lib/orderEnumLabelsRu'

type OrderLine = {
  title?: string
  qty?: number
  priceFrom?: number
  slug?: string
  productId?: string
  variantId?: string
}

function OrderLinesTable() {
  const record = useRecordContext<{ lines?: unknown }>()
  const raw = record?.lines
  const lines: OrderLine[] = Array.isArray(raw) ? (raw as OrderLine[]) : []

  if (lines.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Позиций в заказе нет (пустой состав).
      </Typography>
    )
  }

  return (
    <Table size="small" sx={{ minWidth: 480 }}>
      <TableHead>
        <TableRow>
          <TableCell>Наименование</TableCell>
          <TableCell align="right" width={88}>
            Кол-во
          </TableCell>
          <TableCell align="right" width={120}>
            Цена, ₽
          </TableCell>
          <TableCell width={140}>
            Товар / вариант
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {lines.map((line, i) => (
          <TableRow key={i}>
            <TableCell>{line.title ?? '—'}</TableCell>
            <TableCell align="right">{line.qty ?? 1}</TableCell>
            <TableCell align="right">{line.priceFrom != null ? line.priceFrom : '—'}</TableCell>
            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {line.productId ? `id ${line.productId}` : ''}
              {line.variantId ? ` · вар. ${line.variantId}` : ''}
              {line.slug ? ` · ${line.slug}` : ''}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function JsonBlock({ label, value }: { label: string; value: unknown }): ReactNode {
  if (value == null || (typeof value === 'object' && Object.keys(value as object).length === 0)) {
    return null
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
        {label}
      </Typography>
      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover', overflow: 'auto', maxHeight: 240 }}>
        <Typography component="pre" variant="body2" sx={{ m: 0, fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {text}
        </Typography>
      </Paper>
    </Box>
  )
}

const OrderShowActions = () => (
  <TopToolbar>
    <EditButton />
  </TopToolbar>
)

/** Карточка заказа: клиент, статусы, состав из корзины, снимки доставки. */
export default function OrderShow() {
  return (
    <Show actions={<OrderShowActions />}>
      <SimpleShowLayout>
        <TextField source="orderRef" label="Номер" />
        <DateField source="createdAt" label="Создан" showTime />
        <TextField source="customerName" label="Имя" />
        <TextField source="customerPhone" label="Телефон" />
        <TextField source="customerEmail" label="Email" />
        <TextField source="customerComment" label="Комментарий покупателя" />
        <FunctionField
          label="Выполнение"
          render={(record: { fulfillmentStatus?: string }) =>
            enumLabelRu(FULFILLMENT_STATUS_RU, record.fulfillmentStatus)
          }
        />
        <FunctionField
          label="Оплата"
          render={(record: { paymentStatus?: string }) =>
            enumLabelRu(PAYMENT_STATUS_RU, record.paymentStatus)
          }
        />
        <FunctionField
          label="Доставка"
          render={(record: { deliveryMethod?: string }) =>
            enumLabelRu(DELIVERY_METHOD_RU, record.deliveryMethod)
          }
        />
        <FunctionField
          label="Способ оплаты"
          render={(record: { paymentMethod?: string }) =>
            enumLabelRu(PAYMENT_METHOD_RU, record.paymentMethod)
          }
        />
        <NumberField source="totalApprox" label="Сумма (ориентир), ₽" />
        <FunctionField
          label="Битрикс24"
          render={(record: { bitrixSyncStatus?: string }) =>
            enumLabelRu(BITRIX_SYNC_STATUS_RU, record.bitrixSyncStatus)
          }
        />
        <TextField source="bitrixEntityId" label="ID в Битрикс24" />
        <FunctionField
          label="Состав заказа"
          render={() => (
            <Box sx={{ width: '100%', mt: 0.5 }}>
              <OrderLinesTable />
            </Box>
          )}
        />
        <FunctionField
          label=""
          render={(record) => <JsonBlock label="Снимок доставки (deliverySnapshot)" value={record.deliverySnapshot} />}
        />
        <FunctionField
          label=""
          render={(record) => <JsonBlock label="Платёж (acquiringPayload)" value={record.acquiringPayload} />}
        />
      </SimpleShowLayout>
    </Show>
  )
}
