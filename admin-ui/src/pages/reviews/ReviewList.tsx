import { BooleanField, Datagrid, List, NumberField, SearchInput, TextField } from 'react-admin'

export default function ReviewList() {
  return (
    <List
      sort={{ field: 'sortOrder', order: 'ASC' }}
      filters={[<SearchInput source="search" alwaysOn key="q" />]}
    >
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="name" label="Имя" />
        <TextField source="rating" label="★" />
        <BooleanField source="isPublished" label="На сайте" />
        <TextField source="videoUrl" label="Видео" />
        <NumberField source="sortOrder" label="Порядок" />
      </Datagrid>
    </List>
  )
}
