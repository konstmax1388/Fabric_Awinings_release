import { BooleanField, Datagrid, List, NumberField, TextField } from 'react-admin'

export default function ProductList() {
  return (
    <List perPage={25}>
      <Datagrid rowClick={false} bulkActionButtons={false}>
        <TextField source="title" label="Название" />
        <TextField source="slug" label="Слаг" />
        <TextField source="categoryId" label="Категория (id)" />
        <NumberField source="priceFrom" label="Цена от" />
        <NumberField source="sortOrder" label="Порядок" />
        <BooleanField source="isPublished" label="Опубликован" />
      </Datagrid>
    </List>
  )
}
