import {
  BooleanField,
  BooleanInput,
  Datagrid,
  DateField,
  List,
  TextField,
} from 'react-admin'

const filters = [
  <BooleanInput key="is_default" source="is_default" label="Только адрес по умолчанию" alwaysOn={false} />,
]

export default function ShippingAddressList() {
  return (
    <List perPage={25} sort={{ field: 'createdAt', order: 'DESC' }} filters={filters}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="userId" label="ID пользователя" />
        <TextField source="label" label="Название" />
        <TextField source="city" label="Город" />
        <TextField source="street" label="Улица" />
        <BooleanField source="isDefault" label="По умолчанию" />
        <DateField source="createdAt" label="Создан" showTime />
      </Datagrid>
    </List>
  )
}
