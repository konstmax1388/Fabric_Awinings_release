import { BooleanField, Datagrid, List, NumberField, TextField } from 'react-admin'

export default function ProductCategoryList() {
  return (
    <List perPage={50}>
      <Datagrid rowClick={false} bulkActionButtons={false}>
        <TextField source="title" label="Название" />
        <TextField source="slug" label="Слаг" />
        <NumberField source="sortOrder" label="Порядок" />
        <BooleanField source="isPublished" label="На сайте" />
      </Datagrid>
    </List>
  )
}
