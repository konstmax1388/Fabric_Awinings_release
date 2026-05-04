import {
  BooleanField,
  CreateButton,
  Datagrid,
  FunctionField,
  List,
  NumberField,
  TextField,
  TopToolbar,
} from 'react-admin'

import { StaffImageThumb } from '../../components/StaffImageThumb'
import { StaffResourceIntro } from '../../components/StaffResourceIntro'

const Actions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
)

export default function ProductCategoryList() {
  return (
    <List perPage={50} actions={<Actions />} sort={{ field: 'sortOrder', order: 'ASC' }}>
      <StaffResourceIntro />
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <FunctionField
          label="Превью"
          sortable={false}
          render={(r: { imageUrl?: string }) => <StaffImageThumb src={r.imageUrl} size={56} />}
        />
        <TextField source="title" label="Название" />
        <TextField source="slug" label="Слаг" />
        <NumberField source="sortOrder" label="Порядок" />
        <BooleanField source="isPublished" label="На сайте" />
      </Datagrid>
    </List>
  )
}
