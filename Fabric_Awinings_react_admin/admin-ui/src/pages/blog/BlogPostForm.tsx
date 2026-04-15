import { BooleanInput, DateInput, ImageField, SimpleForm, TextInput } from 'react-admin'

import { StaffImageUploadInput } from '../../components/StaffImageUploadInput'

export function BlogPostForm() {
  return (
    <SimpleForm>
      <TextInput source="title" label="Заголовок" fullWidth required />
      <TextInput source="slug" label="Слаг" fullWidth helperText="Пусто — из заголовка" />
      <TextInput source="excerpt" label="Анонс" fullWidth multiline minRows={2} />
      <TextInput source="body" label="Текст статьи" fullWidth multiline minRows={8} />
      <DateInput source="publishedAt" label="Дата публикации" />
      <BooleanInput source="isPublished" label="На сайте" />
      <ImageField source="coverImageUrl" label="Обложка (сейчас)" />
      <StaffImageUploadInput source="coverImageRelativePath" label="Обложка (загрузка)" />
    </SimpleForm>
  )
}
