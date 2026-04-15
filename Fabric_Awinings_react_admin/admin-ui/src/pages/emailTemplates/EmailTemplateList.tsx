import { Datagrid, List, TextField } from 'react-admin'

export default function EmailTemplateList() {
  return (
    <List sort={{ field: 'key', order: 'ASC' }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="key" label="Ключ" />
        <TextField source="keyLabel" label="Назначение" />
        <TextField source="subject" label="Тема" />
      </Datagrid>
    </List>
  )
}
