import {
  Datagrid,
  DateField,
  FunctionField,
  List,
  SearchInput,
  SelectInput,
  TextField,
  TopToolbar,
  ExportButton,
} from 'react-admin'

import {
  enumLabelRu,
  FULFILLMENT_STATUS_RU,
  PAYMENT_STATUS_RU,
} from '../../lib/orderEnumLabelsRu'

const fulfillmentFilters = [
  { id: 'received', name: 'Принят с сайта' },
  { id: 'awaiting_payment', name: 'Ожидает оплаты' },
  { id: 'paid', name: 'Оплачен' },
  { id: 'processing', name: 'В обработке' },
  { id: 'shipped', name: 'Отправлен' },
  { id: 'delivered', name: 'Доставлен' },
  { id: 'cancelled', name: 'Отменён' },
]

const paymentFilters = [
  { id: 'not_required', name: 'Оплата не требовалась' },
  { id: 'pending', name: 'Ожидает оплаты' },
  { id: 'authorized', name: 'Предавторизация' },
  { id: 'captured', name: 'Оплачен' },
  { id: 'failed', name: 'Ошибка оплаты' },
  { id: 'refunded', name: 'Возврат' },
]

const filters = [
  <SearchInput
    key="search"
    source="search"
    alwaysOn
    placeholder="Номер заказа, телефон, email…"
  />,
  <SelectInput
    key="fulfillment_status"
    source="fulfillment_status"
    label="Статус выполнения"
    choices={fulfillmentFilters}
    emptyText="Все"
  />,
  <SelectInput
    key="payment_status"
    source="payment_status"
    label="Оплата"
    choices={paymentFilters}
    emptyText="Все"
  />,
]

const ListActions = () => (
  <TopToolbar>
    <ExportButton />
  </TopToolbar>
)

/** Список заказов: поиск по номеру/телефону/email, фильтры по статусам. Карточка — просмотр состава. */
export default function OrderList() {
  return (
    <List
      perPage={25}
      sort={{ field: 'createdAt', order: 'DESC' }}
      filters={filters}
      actions={<ListActions />}
    >
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="orderRef" label="Номер" />
        <TextField source="customerName" label="Клиент" />
        <TextField source="customerPhone" label="Телефон" />
        <FunctionField
          label="Статус"
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
        <DateField source="createdAt" label="Создан" showTime />
      </Datagrid>
    </List>
  )
}
