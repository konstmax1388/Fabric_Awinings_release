import { Edit, ListButton, SimpleForm, TextInput, TopToolbar } from 'react-admin'

const EmailToolbar = () => (
  <TopToolbar>
    <ListButton />
  </TopToolbar>
)

export default function EmailTemplateEdit() {
  return (
    <Edit actions={<EmailToolbar />}>
      <SimpleForm>
        <TextInput source="key" label="Ключ" disabled />
        <TextInput source="keyLabel" label="Назначение" disabled />
        <TextInput source="subject" label="Тема письма" fullWidth />
        <TextInput source="body" label="Текст письма" fullWidth multiline minRows={12} />
      </SimpleForm>
    </Edit>
  )
}
