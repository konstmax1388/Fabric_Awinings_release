import { Create, SimpleForm } from 'react-admin'

import { ProductMainFields } from './ProductForm'

export default function ProductCreate() {
  return (
    <Create redirect="edit">
      <SimpleForm defaultValues={{ teasers: [], marketplaceLinks: {} }}>
        <ProductMainFields />
      </SimpleForm>
    </Create>
  )
}
