import { CreateButton, useRecordContext } from 'react-admin'

type Props = {
  resource: string
  label: string
}

/** Кнопка создания дочернего ресурса с подстановкой productId текущего товара. */
export function CatalogNestedCreateButton({ resource, label }: Props) {
  const record = useRecordContext()
  if (!record?.id) return null
  return (
    <CreateButton
      resource={resource}
      label={label}
      state={{ record: { productId: record.id } }}
    />
  )
}
