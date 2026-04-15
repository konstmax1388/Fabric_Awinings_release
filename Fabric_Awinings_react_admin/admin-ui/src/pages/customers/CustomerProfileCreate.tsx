import { Create, DateTimeInput, NumberInput, SimpleForm, TextInput } from 'react-admin'

export default function CustomerProfileCreate() {
  return (
    <Create>
      <SimpleForm>
        <NumberInput
          source="userId"
          label="ID учётной записи"
          fullWidth
          required
          helperText="Числовой ID из Django Admin → Пользователи."
        />
        <TextInput source="phone" label="Телефон" fullWidth />
        <DateTimeInput source="passwordChangeDeadline" label="Сменить пароль до (необязательно)" />
      </SimpleForm>
    </Create>
  )
}
