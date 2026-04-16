import { Create, NumberInput, ReferenceInput, SelectInput, SimpleForm, TextInput } from 'react-admin'
import { useLocation, useSearchParams } from 'react-router-dom'

import { StaffImageUploadInput } from '../../components/StaffImageUploadInput'

export default function ProductImageCreate() {
  const [sp] = useSearchParams()
  const location = useLocation()
  const fromState = (location.state as { record?: { productId?: string } })?.record?.productId
  const qProduct = fromState || sp.get('productId') || ''

  return (
    <Create
      resource="product-images"
      redirect="edit"
      transform={(data: Record<string, unknown>) => ({
        ...data,
        productId: data.productId || qProduct,
      })}
    >
      <SimpleForm defaultValues={{ productId: qProduct || undefined }}>
        <TextInput source="productId" label="ID товара" fullWidth required />
        <ReferenceInput source="variantId" reference="product-variants" filter={{ productId: qProduct }}>
          <SelectInput optionText="label" label="Вариант (необязательно)" emptyText="—" />
        </ReferenceInput>
        <NumberInput source="sortOrder" label="Порядок" />
        <StaffImageUploadInput source="imageRelativePath" label="Файл изображения" />
      </SimpleForm>
    </Create>
  )
}
