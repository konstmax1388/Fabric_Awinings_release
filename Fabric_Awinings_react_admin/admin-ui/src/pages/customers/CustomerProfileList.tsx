import { Datagrid, DateField, List, TextField } from 'react-admin'

export default function CustomerProfileList() {
  return (
    <List perPage={25} sort={{ field: 'updatedAt', order: 'DESC' }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="userId" label="ID пользователя" />
        <TextField source="phone" label="Телефон" />
        <DateField source="passwordChangeDeadline" label="Сменить пароль до" showTime />
        <DateField source="updatedAt" label="Обновлён" showTime />
      </Datagrid>
    </List>
  )
}
