import { Datagrid, List, TextField } from 'react-admin'

export default function CallbackLeadList() {
  return (
    <List perPage={25} sort={{ field: 'createdAt', order: 'DESC' }}>
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="name" label="Имя" />
        <TextField source="phone" label="Телефон" />
        <TextField source="sourceLabel" label="Источник" />
        <TextField source="createdAt" label="Создано" />
      </Datagrid>
    </List>
  )
}
