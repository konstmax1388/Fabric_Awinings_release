import { BooleanInput, ImageField, NumberInput, SimpleForm, TextInput } from 'react-admin'

import { StaffImageUploadInput } from '../../components/StaffImageUploadInput'

export function ReviewForm() {
  return (
    <SimpleForm>
      <TextInput source="name" label="Имя" fullWidth required />
      <TextInput source="text" label="Текст" fullWidth multiline minRows={4} required />
      <NumberInput source="rating" label="Оценка (1–5)" min={1} max={5} />
      <TextInput source="videoUrl" label="Видео (URL)" fullWidth />
      <BooleanInput source="isPublished" label="На сайте" />
      <NumberInput source="sortOrder" label="Порядок" />
      <ImageField source="photoUrl" label="Фото (сейчас)" />
      <StaffImageUploadInput source="photoRelativePath" label="Фото (загрузка)" />
    </SimpleForm>
  )
}
