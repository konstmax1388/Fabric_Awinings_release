import { Datagrid, DateField, List, NumberField, SearchInput, TextField } from 'react-admin'

const filters = [
  <SearchInput key="search" source="search" alwaysOn placeholder="Имя, телефон, материал…" />,
]

export default function CalculatorLeadList() {
  return (
    <List perPage={25} filters={filters}>
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="name" label="Имя" />
        <TextField source="phone" label="Телефон" />
        <NumberField source="estimatedPriceRub" label="Оценка, ₽" />
        <DateField source="createdAt" label="Дата" showTime />
      </Datagrid>
    </List>
  )
}
