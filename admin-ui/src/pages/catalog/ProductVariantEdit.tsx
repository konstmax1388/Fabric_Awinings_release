import { BooleanInput, Edit, NumberInput, SimpleForm, TextInput } from 'react-admin'

export default function ProductVariantEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="productId" label="ID товара" disabled fullWidth />
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
    </Edit>
  )
}
