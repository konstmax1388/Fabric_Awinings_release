import { BooleanInput, Edit, SimpleForm, TextInput } from 'react-admin'

export default function UserEdit() {
  return (
    <Edit mutationMode="pessimistic">
      <SimpleForm>
        <TextInput source="username" label="Логин" disabled />
        <TextInput source="email" label="Email" type="email" />
        <TextInput source="firstName" label="Имя" />
        <TextInput source="lastName" label="Фамилия" />
        <BooleanInput source="isActive" label="Активен" />
        <BooleanInput source="isStaff" label="Доступ в панель (staff)" />
        <TextInput source="password" label="Новый пароль (оставьте пустым, чтобы не менять)" type="password" />
      </SimpleForm>
    </Edit>
  )
}
