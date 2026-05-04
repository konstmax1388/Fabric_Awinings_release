import { BooleanField, Datagrid, DateField, List, SearchInput, TextField } from 'react-admin'

import { StaffResourceIntro } from '../../components/StaffResourceIntro'

export default function BlogPostList() {
  return (
    <List
      sort={{ field: 'publishedAt', order: 'DESC' }}
      filters={[<SearchInput source="search" alwaysOn key="q" />]}
    >
      <StaffResourceIntro />
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="title" label="Заголовок" />
        <TextField source="slug" label="Слаг" />
        <DateField source="publishedAt" label="Дата публикации" />
        <BooleanField source="isPublished" label="На сайте" />
      </Datagrid>
    </List>
  )
}
