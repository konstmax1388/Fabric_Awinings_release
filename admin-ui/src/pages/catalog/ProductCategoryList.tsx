import {
  BooleanField,
  CreateButton,
  Datagrid,
  List,
  NumberField,
  TextField,
  TopToolbar,
} from 'react-admin'

const Actions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
)

export default function ProductCategoryList() {
  return (
    <List perPage={50} actions={<Actions />} sort={{ field: 'sortOrder', order: 'ASC' }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="title" label="Название" />
        <TextField source="slug" label="Слаг" />
        <NumberField source="sortOrder" label="Порядок" />
        <BooleanField source="isPublished" label="На сайте" />
      </Datagrid>
    </List>
  )
}
