import { DateField, Show, SimpleShowLayout, TextField } from 'react-admin'

export default function OrderShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="orderRef" label="Номер" />
        <DateField source="createdAt" label="Создан" showTime />
        <TextField source="customerName" label="Имя" />
        <TextField source="customerPhone" label="Телефон" />
        <TextField source="customerEmail" label="Email" />
        <TextField source="fulfillmentStatus" label="Выполнение" />
        <TextField source="paymentStatus" label="Оплата" />
        <TextField source="deliveryMethod" label="Доставка" />
        <TextField source="paymentMethod" label="Способ оплаты" />
        <TextField source="bitrixSyncStatus" label="Битрикс24" />
        <TextField source="totalApprox" label="Сумма (ориентир)" />
      </SimpleShowLayout>
    </Show>
  )
}
