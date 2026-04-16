import { DateField, NumberField, Show, SimpleShowLayout, TextField } from 'react-admin'

export default function CalculatorLeadShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="name" label="Имя" />
        <TextField source="phone" label="Телефон" />
        <TextField source="comment" label="Комментарий" />
        <TextField source="lengthM" label="Длина, м" />
        <TextField source="widthM" label="Ширина, м" />
        <TextField source="materialId" label="Материал (код)" />
        <TextField source="materialLabel" label="Материал" />
        <NumberField source="estimatedPriceRub" label="Оценка, ₽" />
        <DateField source="createdAt" label="Создана" showTime />
      </SimpleShowLayout>
    </Show>
  )
}
