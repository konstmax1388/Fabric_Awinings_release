import { Create, NumberInput, SimpleForm, TextInput } from 'react-admin'
import { useLocation, useSearchParams } from 'react-router-dom'

export default function ProductSpecificationCreate() {
  const [sp] = useSearchParams()
  const location = useLocation()
  const fromState = (location.state as { record?: { productId?: string } })?.record?.productId
  const qProduct = fromState || sp.get('productId') || ''

  return (
    <Create
      resource="product-specifications"
      redirect="edit"
      transform={(data: Record<string, unknown>) => ({
        ...data,
        productId: data.productId || qProduct,
      })}
    >
      <SimpleForm defaultValues={{ productId: qProduct || undefined }}>
        <TextInput source="productId" label="ID товара" fullWidth required />
        <TextInput source="groupName" label="Группа" fullWidth />
        <TextInput source="name" label="Имя" fullWidth required />
        <TextInput source="value" label="Значение" fullWidth required />
        <NumberInput source="sortOrder" label="Порядок" />
      </SimpleForm>
    </Create>
  )
}
