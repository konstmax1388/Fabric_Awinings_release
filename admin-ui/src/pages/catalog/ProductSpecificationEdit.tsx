import { Edit, NumberInput, SimpleForm, TextInput } from 'react-admin'

export default function ProductSpecificationEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="productId" label="ID товара" disabled fullWidth />
        <TextInput source="groupName" label="Группа" fullWidth />
        <TextInput source="name" label="Имя" fullWidth required />
        <TextInput source="value" label="Значение" fullWidth required />
        <NumberInput source="sortOrder" label="Порядок" />
      </SimpleForm>
    </Edit>
  )
}
