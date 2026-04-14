import { Show, SimpleShowLayout, TextField } from 'react-admin'

export default function CallbackLeadShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="id" label="ID" />
        <TextField source="name" label="Имя" />
        <TextField source="phone" label="Телефон" />
        <TextField source="comment" label="Комментарий" />
        <TextField source="source" label="Код источника" />
        <TextField source="sourceLabel" label="Источник" />
        <TextField source="createdAt" label="Создано" />
      </SimpleShowLayout>
    </Show>
  )
}
