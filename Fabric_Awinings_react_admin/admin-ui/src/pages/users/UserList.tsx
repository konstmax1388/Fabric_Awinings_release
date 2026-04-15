import { BooleanField, Datagrid, DateField, List, TextField } from 'react-admin'

export default function UserList() {
  return (
    <List perPage={50}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="username" label="Логин" />
        <TextField source="email" label="Email" />
        <BooleanField source="isStaff" label="Staff" />
        <BooleanField source="isActive" label="Активен" />
        <DateField source="lastLogin" label="Вход" showTime />
      </Datagrid>
    </List>
  )
}
