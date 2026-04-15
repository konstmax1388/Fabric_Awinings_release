import {
  BooleanInput,
  DateInput,
  ImageField,
  NumberInput,
  SimpleForm,
  TextInput,
} from 'react-admin'

import { StaffImageUploadInput } from '../../components/StaffImageUploadInput'

export function PortfolioForm() {
  return (
    <SimpleForm>
      <TextInput source="title" label="Название" fullWidth required />
      <TextInput source="slug" label="Слаг" fullWidth helperText="Пусто — из заголовка" />
      <TextInput source="category" label="Категория / подпись" fullWidth />
      <DateInput source="completedOn" label="Дата завершения" />
      <BooleanInput source="isPublished" label="На сайте" />
      <NumberInput source="sortOrder" label="Порядок" />
      <ImageField source="beforeImageUrl" label="Фото «до» (сейчас)" />
      <StaffImageUploadInput
        source="beforeImageRelativePath"
        label="Файл «до» (загрузка)"
        helperText="Сначала загрузите файл; путь подставится в поле."
      />
      <ImageField source="afterImageUrl" label="Фото «после» (сейчас)" />
      <StaffImageUploadInput source="afterImageRelativePath" label="Файл «после» (загрузка)" />
    </SimpleForm>
  )
}
