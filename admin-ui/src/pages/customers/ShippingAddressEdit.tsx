import { BooleanInput, Edit, NumberInput, SimpleForm, TextInput } from 'react-admin'

export default function ShippingAddressEdit() {
  return (
    <Edit mutationMode="pessimistic">
      <SimpleForm>
        <NumberInput
          source="userId"
          label="ID учётной записи"
          fullWidth
          required
          helperText="Числовой ID из Django Admin → Пользователи."
        />
        <TextInput source="label" label="Название" fullWidth />
        <BooleanInput source="isDefault" label="По умолчанию" />
        <TextInput source="postalCode" label="Индекс" fullWidth />
        <TextInput source="city" label="Город" fullWidth required />
        <TextInput source="street" label="Улица" fullWidth required />
        <TextInput source="building" label="Дом / корпус" fullWidth />
        <TextInput source="apartment" label="Квартира / офис" fullWidth />
        <TextInput source="recipientName" label="Получатель" fullWidth />
        <TextInput source="recipientPhone" label="Телефон получателя" fullWidth />
      </SimpleForm>
    </Edit>
  )
}
