import { Edit, FormDataConsumer, NumberInput, ReferenceInput, SelectInput, SimpleForm, TextInput } from 'react-admin'

import { StaffImageUploadInput } from '../../components/StaffImageUploadInput'

export default function ProductImageEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="productId" label="ID товара" disabled fullWidth />
        <FormDataConsumer>
          {({ formData }) => (
            <ReferenceInput
              source="variantId"
              reference="product-variants"
              filter={formData?.productId ? { productId: formData.productId } : undefined}
            >
              <SelectInput optionText="label" label="Вариант" emptyText="—" />
            </ReferenceInput>
          )}
        </FormDataConsumer>
        <NumberInput source="sortOrder" label="Порядок" />
        <StaffImageUploadInput source="imageRelativePath" label="Заменить изображение" />
      </SimpleForm>
    </Edit>
  )
}
