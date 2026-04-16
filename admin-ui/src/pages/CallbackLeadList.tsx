import { Datagrid, List, SearchInput, TextField } from 'react-admin'

const filters = [
  <SearchInput key="search" source="search" alwaysOn placeholder="Имя, телефон, комментарий…" />,
]

export default function CallbackLeadList() {
  return (
    <List perPage={25} sort={{ field: 'createdAt', order: 'DESC' }} filters={filters}>
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="name" label="Имя" />
        <TextField source="phone" label="Телефон" />
        <TextField source="sourceLabel" label="Источник" />
        <TextField source="createdAt" label="Создано" />
      </Datagrid>
    </List>
  )
}
