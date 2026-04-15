import { DateTimeInput, Edit, NumberInput, SimpleForm, TextInput } from 'react-admin'

export default function CustomerProfileEdit() {
  return (
    <Edit mutationMode="pessimistic">
      <SimpleForm>
        <NumberInput
          source="userId"
          label="ID учётной записи"
          fullWidth
          required
          helperText="Числовой ID из Django Admin → Пользователи (если нужно сопоставить с учётной записью)."
        />
        <TextInput source="phone" label="Телефон" fullWidth />
        <DateTimeInput source="passwordChangeDeadline" label="Сменить пароль до" />
      </SimpleForm>
    </Edit>
  )
}
