import {
  BooleanInput,
  CheckboxGroupInput,
  NumberInput,
  ReferenceInput,
  SelectInput,
  TextInput,
} from 'react-admin'

function mpJsonFormat(v: unknown): string {
  if (v && typeof v === 'object') return JSON.stringify(v, null, 2)
  return '{}'
}

function mpJsonParse(s: string): Record<string, string> {
  try {
    const o = JSON.parse(s || '{}') as unknown
    return typeof o === 'object' && o !== null && !Array.isArray(o) ? (o as Record<string, string>) : {}
  } catch {
    return {}
  }
}

/** Поля карточки товара (внутри SimpleForm или TabbedForm.Tab). */
export function ProductMainFields() {
  return (
    <>
      <TextInput source="title" label="Название" fullWidth required />
      <TextInput source="slug" label="Слаг" fullWidth />
      <TextInput source="excerpt" label="Анонс" fullWidth multiline minRows={2} />
      <TextInput source="description" label="Описание (plain)" fullWidth multiline minRows={3} />
      <TextInput source="descriptionHtml" label="Описание (HTML)" fullWidth multiline minRows={4} />
      <ReferenceInput source="categoryId" reference="product-categories">
        <SelectInput optionText="title" label="Категория" />
      </ReferenceInput>
      <NumberInput source="priceFrom" label="Цена от" />
      <BooleanInput source="showOnHome" label="На главной" />
      <BooleanInput source="isPublished" label="Опубликован" />
      <NumberInput source="sortOrder" label="Порядок в категории" />
      <CheckboxGroupInput
        source="teasers"
        label="Тизеры"
        choices={[
          { id: 'bestseller', name: 'Хит' },
          { id: 'new', name: 'Новинка' },
          { id: 'recommended', name: 'Рекомендуем' },
        ]}
      />
      <TextInput
        source="marketplaceLinks"
        label="Ссылки маркетплейсов (JSON: wb, ozon, ym, avito)"
        fullWidth
        multiline
        minRows={3}
        format={mpJsonFormat}
        parse={mpJsonParse}
      />
      <NumberInput source="bitrixCatalogId" label="Bitrix: catalog id" />
      <TextInput source="bitrixXmlId" label="Bitrix: XML id" fullWidth />
      <NumberInput source="ozonSku" label="Ozon SKU" />
    </>
  )
}
