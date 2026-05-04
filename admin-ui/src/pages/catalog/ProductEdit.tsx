import {
  BooleanField,
  Datagrid,
  DeleteButton,
  Edit,
  EditButton,
  FunctionField,
  NumberField,
  ReferenceManyField,
  TextField,
} from 'react-admin'
import { TabbedForm } from 'react-admin'

import { StaffImageThumb } from '../../components/StaffImageThumb'
import { CatalogNestedCreateButton } from './CatalogNestedCreateButton'
import { ProductImageReorderPanel, ProductVariantReorderPanel } from './ProductReorderPanel'
import { ProductMainFields } from './ProductForm'

export default function ProductEdit() {
  return (
    <Edit>
      <TabbedForm syncWithLocation={false}>
        <TabbedForm.Tab label="Карточка товара">
          <ProductMainFields />
        </TabbedForm.Tab>
        <TabbedForm.Tab label="Варианты" path="variants">
          <ReferenceManyField reference="product-variants" target="productId" label={false} perPage={100}>
            <Datagrid bulkActionButtons={false} rowClick="edit">
              <TextField source="label" label="Подпись" />
              <NumberField source="priceFrom" label="Цена от" />
              <BooleanField source="isDefault" label="По умолчанию" />
              <EditButton />
              <DeleteButton redirect={false} />
            </Datagrid>
          </ReferenceManyField>
          <CatalogNestedCreateButton resource="product-variants" label="Добавить вариант" />
        </TabbedForm.Tab>
        <TabbedForm.Tab label="Изображения" path="images">
          <ReferenceManyField reference="product-images" target="productId" label={false} perPage={100}>
            <Datagrid bulkActionButtons={false} rowClick="edit">
              <FunctionField
                label="Превью"
                sortable={false}
                render={(r: { imageUrl?: string }) => <StaffImageThumb src={r?.imageUrl} size={72} />}
              />
              <TextField source="imageUrl" label="Адрес файла" />
              <TextField source="variantId" label="Вариант id" />
              <NumberField source="sortOrder" label="Порядок" />
              <EditButton />
              <DeleteButton redirect={false} />
            </Datagrid>
          </ReferenceManyField>
          <CatalogNestedCreateButton resource="product-images" label="Добавить изображение" />
        </TabbedForm.Tab>
        <TabbedForm.Tab label="Характеристики" path="specs">
          <ReferenceManyField reference="product-specifications" target="productId" label={false} perPage={200}>
            <Datagrid bulkActionButtons={false} rowClick="edit">
              <TextField source="groupName" label="Группа" />
              <TextField source="name" label="Имя" />
              <TextField source="value" label="Значение" />
              <NumberField source="sortOrder" label="Порядок" />
              <EditButton />
              <DeleteButton redirect={false} />
            </Datagrid>
          </ReferenceManyField>
          <CatalogNestedCreateButton resource="product-specifications" label="Добавить строку" />
        </TabbedForm.Tab>
        <TabbedForm.Tab label="Порядок" path="reorder">
          <ProductVariantReorderPanel />
          <ProductImageReorderPanel />
        </TabbedForm.Tab>
      </TabbedForm>
    </Edit>
  )
}
