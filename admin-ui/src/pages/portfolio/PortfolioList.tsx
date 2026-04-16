import { BooleanField, Datagrid, List, NumberField, SearchInput, TextField } from 'react-admin'

export default function PortfolioList() {
  return (
    <List
      sort={{ field: 'sortOrder', order: 'ASC' }}
      filters={[<SearchInput source="search" alwaysOn key="q" />]}
    >
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="title" label="Название" />
        <TextField source="slug" label="Слаг" />
        <TextField source="category" label="Категория" />
        <BooleanField source="isPublished" label="На сайте" />
        <NumberField source="sortOrder" label="Порядок" />
      </Datagrid>
    </List>
  )
}
