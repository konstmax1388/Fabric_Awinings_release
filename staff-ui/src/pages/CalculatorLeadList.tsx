import { Datagrid, DateField, List, NumberField, TextField } from 'react-admin'

export default function CalculatorLeadList() {
  return (
    <List perPage={25}>
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="name" label="Имя" />
        <TextField source="phone" label="Телефон" />
        <NumberField source="estimatedPriceRub" label="Оценка, ₽" />
        <DateField source="createdAt" label="Дата" showTime />
      </Datagrid>
    </List>
  )
}
