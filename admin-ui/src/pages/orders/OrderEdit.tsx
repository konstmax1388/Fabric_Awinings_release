import {
  Edit,
  SelectInput,
  SimpleForm,
  TextInput,
} from 'react-admin'

const fulfillmentChoices = [
  { id: 'received', name: 'Принят с сайта' },
  { id: 'awaiting_payment', name: 'Ожидает оплаты' },
  { id: 'paid', name: 'Оплачен' },
  { id: 'processing', name: 'В обработке' },
  { id: 'shipped', name: 'Отправлен' },
  { id: 'delivered', name: 'Доставлен' },
  { id: 'cancelled', name: 'Отменён' },
]

const paymentChoices = [
  { id: 'not_required', name: 'Оплата не требовалась' },
  { id: 'pending', name: 'Ожидает оплаты' },
  { id: 'authorized', name: 'Предавторизация' },
  { id: 'captured', name: 'Оплачен' },
  { id: 'failed', name: 'Ошибка оплаты' },
  { id: 'refunded', name: 'Возврат' },
]

const bitrixSyncChoices = [
  { id: 'not_sent', name: 'Не отправляли в Б24' },
  { id: 'pending', name: 'Очередь / повтор' },
  { id: 'synced', name: 'В Битрикс24' },
  { id: 'error', name: 'Ошибка синхронизации' },
]

export default function OrderEdit() {
  return (
    <Edit mutationMode="pessimistic">
      <SimpleForm>
        <TextInput source="orderRef" label="Номер" disabled />
        <TextInput source="customerName" label="Имя" />
        <TextInput source="customerPhone" label="Телефон" />
        <TextInput source="customerEmail" label="Email" />
        <TextInput source="customerComment" label="Комментарий" multiline />
        <SelectInput source="fulfillmentStatus" label="Выполнение" choices={fulfillmentChoices} />
        <SelectInput source="paymentStatus" label="Оплата" choices={paymentChoices} />
        <TextInput source="paymentProvider" label="Платёжный провайдер" />
        <TextInput source="paymentExternalId" label="ID платежа у провайдера" />
        <TextInput source="cdekTracking" label="Трек СДЭК" />
        <TextInput source="bitrixEntityId" label="ID в Битрикс24" />
        <SelectInput source="bitrixSyncStatus" label="Синхронизация Б24" choices={bitrixSyncChoices} />
        <TextInput source="bitrixSyncError" label="Ошибка Б24" multiline />
      </SimpleForm>
    </Edit>
  )
}
