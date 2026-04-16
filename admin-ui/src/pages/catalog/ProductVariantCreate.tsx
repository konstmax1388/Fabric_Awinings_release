import { BooleanInput, Create, NumberInput, SimpleForm, TextInput } from 'react-admin'
import { useLocation, useSearchParams } from 'react-router-dom'

export default function ProductVariantCreate() {
  const [sp] = useSearchParams()
  const location = useLocation()
  const fromState = (location.state as { record?: { productId?: string } })?.record?.productId
  const qProduct = fromState || sp.get('productId') || ''

  return (
    <Create
      resource="product-variants"
      redirect="edit"
      transform={(data: Record<string, unknown>) => ({
        ...data,
        productId: data.productId || qProduct,
      })}
    >
      <SimpleForm defaultValues={{ productId: qProduct || undefined }}>
        <TextInput source="productId" label="ID товара" fullWidth required helperText="Подставляется из карточки товара" />
        <TextInput source="label" label="Подпись" fullWidth required />
        <NumberInput source="priceFrom" label="Цена от" />
        <NumberInput source="sortOrder" label="Порядок" />
        <BooleanInput source="isDefault" label="Вариант по умолчанию" />
        <NumberInput source="wbNmId" label="WB nm_id" />
        <TextInput source="marketplaceWbUrl" label="Ссылка WB" fullWidth />
        <NumberInput source="bitrixCatalogId" label="Bitrix catalog id" />
        <TextInput source="bitrixXmlId" label="Bitrix XML id" fullWidth />
        <NumberInput source="ozonSku" label="Ozon SKU" />
      </SimpleForm>
    </Create>
  )
}
