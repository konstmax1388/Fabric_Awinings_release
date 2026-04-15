import { Datagrid, DateField, List, TextField } from 'react-admin'

export default function OrderList() {
  return (
    <List perPage={25}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="orderRef" label="Номер" />
        <TextField source="customerName" label="Клиент" />
        <TextField source="customerPhone" label="Телефон" />
        <TextField source="fulfillmentStatus" label="Статус" />
        <TextField source="paymentStatus" label="Оплата" />
        <DateField source="createdAt" label="Создан" showTime />
      </Datagrid>
    </List>
  )
}
