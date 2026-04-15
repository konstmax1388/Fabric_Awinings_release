import { BooleanInput, Edit, NumberInput, SimpleForm, TextInput } from 'react-admin'

import { StaffImageUploadInput } from '../../components/StaffImageUploadInput'

export default function ProductCategoryEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="title" label="Название" fullWidth required />
        <TextInput source="slug" label="Слаг" fullWidth />
        <NumberInput source="sortOrder" label="Порядок" />
        <BooleanInput source="isPublished" label="На сайте" />
        <StaffImageUploadInput source="imageRelativePath" label="Новое изображение (загрузка)" />
      </SimpleForm>
    </Edit>
  )
}
