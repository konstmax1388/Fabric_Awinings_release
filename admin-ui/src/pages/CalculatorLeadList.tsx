import { Datagrid, DateField, List, NumberField, SearchInput, TextField } from 'react-admin'

import { StaffResourceIntro } from '../components/StaffResourceIntro'

const filters = [
  <SearchInput key="search" source="search" alwaysOn placeholder="Имя, телефон, материал…" />,
]

export default function CalculatorLeadList() {
  return (
    <List perPage={25} filters={filters}>
      <StaffResourceIntro />
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="name" label="Имя" />
        <TextField source="phone" label="Телефон" />
        <NumberField source="estimatedPriceRub" label="Оценка, ₽" />
        <DateField source="createdAt" label="Дата" showTime />
      </Datagrid>
    </List>
  )
}
