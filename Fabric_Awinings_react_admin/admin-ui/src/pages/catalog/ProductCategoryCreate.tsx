import { BooleanInput, Create, NumberInput, SimpleForm, TextInput } from 'react-admin'

import { StaffImageUploadInput } from '../../components/StaffImageUploadInput'

export default function ProductCategoryCreate() {
  return (
    <Create redirect="list">
      <SimpleForm>
        <TextInput source="title" label="Название" fullWidth required />
        <TextInput source="slug" label="Слаг" fullWidth helperText="Пусто — из названия" />
        <NumberInput source="sortOrder" label="Порядок" />
        <BooleanInput source="isPublished" label="На сайте" />
        <StaffImageUploadInput source="imageRelativePath" label="Картинка категории" />
      </SimpleForm>
    </Create>
  )
}
