import { Datagrid, List, TextField } from 'react-admin'

export default function GroupList() {
  return (
    <List perPage={100}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="name" label="Группа" />
      </Datagrid>
    </List>
  )
}
