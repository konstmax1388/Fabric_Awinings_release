import {
  BooleanField,
  BooleanInput,
  CreateButton,
  Datagrid,
  List,
  ReferenceField,
  ReferenceInput,
  SearchInput,
  SelectInput,
  TextField,
  TopToolbar,
  NumberField,
} from 'react-admin'

const Actions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
)

const filters = [
  <SearchInput key="search" source="search" alwaysOn placeholder="Название, слаг…" />,
  <ReferenceInput key="cat" source="categoryId" reference="product-categories" label="Категория">
    <SelectInput optionText="title" emptyText="Все категории" />
  </ReferenceInput>,
  <BooleanInput key="pub" source="is_published" label="На сайте (опубликован)" />,
]

/** Товары: поиск, фильтр по категории и публикации, пагинация из List. */
export default function ProductList() {
  return (
    <List perPage={25} actions={<Actions />} filters={filters} sort={{ field: 'sortOrder', order: 'ASC' }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="title" label="Название" />
        <TextField source="slug" label="Слаг" />
        <ReferenceField source="categoryId" reference="product-categories" label="Категория" link={false}>
          <TextField source="title" />
        </ReferenceField>
        <NumberField source="priceFrom" label="Цена от, ₽" />
        <NumberField source="sortOrder" label="Порядок" />
        <BooleanField source="isPublished" label="На сайте" />
      </Datagrid>
    </List>
  )
}
